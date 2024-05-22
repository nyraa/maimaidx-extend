import Router from "../router.js";
import * as cheerio from "cheerio";
import db from "../database.js";
import recordDOMString from "./recordDOMString.js";

Router.register(/\/record\/$/, (req, html) => {
    const $ = cheerio.load(html);

    // get all record div blocks
    $("div:has(>.playlog_top_container)").each((i, e) => {
        const element = $(e);

        // get play time as record id and inject achievement diff
        const datetime = new Date(element.find(".sub_title span:not(.red)").text().trim() + " GMT+0900");
        const recordIdInt = datetime.getTime();

        const record = db.chain.get("records").find((r) => new Date(r.datetime).getTime() === recordIdInt).value();
        if(!record)
        {
            console.log(`Record miss ${datetime.toDateString()}`);
            return;
        }

        const diffDomString = `<span class="f_10" style="display: block;">${record.achievementDiff >= 0 ? "+" : ""}${record.achievementDiff.toFixed(4)}%</span>`;
        element.find(".playlog_achievement_txt>.f_20").after(diffDomString);
    });

    $("footer").before(`
        <div class="t_c" id="viewmore_action">
            <script language="javascript">
                let viewmore_offset = 50;
                let viewmore_loading = false;
                function viewmore()
                {
                    if(viewmore_loading || viewmore_offset === null)
                    {
                        return;
                    }
                    viewmore_loading = true;
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", "/extend/recorddata/?offset=" + viewmore_offset);
                    xhr.onreadystatechange = () => {
                        if(xhr.readyState === 4 && xhr.status === 200)
                        {
                            const data = JSON.parse(xhr.responseText);
                            const formatter = new Intl.DateTimeFormat("ja", {
                                timeZone: "Asia/Tokyo",
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            });
                            for(let record of data.data)
                            {
                                ${recordDOMString}
                                $("#viewmore_action").before(domstring);
                            }
                            viewmore_offset = data.next;
                            if(viewmore_offset === null)
                            {
                                $("#viewmore_action").remove();
                            }
                            viewmore_loading = false;
                        }
                    };
                    xhr.onerror = () => {
                        viewmore_loading = false;
                    };
                    xhr.send();
                }
            </script>
            <img src="https://maimaidx-eng.com/maimai-mobile/img/line_02.png" class="w_450" />
            <button type="button" onclick="javascript:viewmore()" class="m_10">
                <img src="https://maimaidx-eng.com/maimai-mobile/img/btn_more.png" class="w_84" />
            </button>
        </div>
    `);
    return $.html();
});
