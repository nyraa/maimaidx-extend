import Router from "../router.js";
import * as cheerio from "cheerio";
import { getCacheFileSync } from "../cache.js";

Router.register(/\/photo\/$/, (req, html) => {
    const $ = cheerio.load(html);

    // replace album photo src
    $('img[src^="https://maimaidx-eng.com/maimai-mobile/img/photo/"]').each((index, element) => {
        const origSrc = $(element).attr("src");
        const newSrc = origSrc.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("src", newSrc);
    });

    // add download attribute to save button (on client side)
    $("body").append(`
        <script language="javascript">
            ${getCacheFileSync("src/injects/client/saveButton.js.txt")}
        </script>
    `);

    // remove body context menu limitation
    $("body").removeAttr("oncontextmenu");

    // inject more photo
    $("footer").before(`
        <div class="t_c" id="viewmore_action">
            <script language="javascript">
                let viewmore_offset = 10;
                let viewmore_loading = false;
                function viewmore()
                {
                    if(viewmore_loading || viewmore_offset === null)
                    {
                        return;
                    }
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", "/extend/photodata/?offset=" + viewmore_offset);
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
                                const domstring = \`
                                    <div class=" m_10 p_5 f_0">
                                        <div class="music_$\{record.difficulty}_score_back p_r p_5">
                                            $\{record.kind ? \`<img src="https://maimaidx-eng.com/maimai-mobile/img/music_$\{record.kind}.png" class="music_kind_icon f_r">\` : ""}
                                            <div class="block_info p_3 f_11 white">$\{formatter.format(new Date(record.datetime))}</div>
                                            <img src="https://maimaidx-eng.com/maimai-mobile/img/diff_$\{record.difficulty}.png" class="h_16 f_l">
                                            <br>
                                            $\{record.utageKind ? record.utageKind.map((tag) => \`
                                                <div class="music_kind_icon_utage f_l">
                                                    <img src="https://maimaidx-eng.com/maimai-mobile/img/music_$\{tag.icon}.png" class="h_20">
                                                    <div class="white music_kind_icon_utage_text_photo f_10 t_c">$\{tag.text}</div>
                                                </div>
                                            \`) : ""}
                                            <div class="clearfix"></div>
                                            <div class="black_block w_430 m_3 m_b_5 p_5 t_l f_15 break">$\{record.songname}</div>
                                            <img src="/extend/photofile/$\{record.filename}" class="w_430">
                                            <div class="col2 f_l">
                                                <a href="/extend/photofile/$\{record.filename}" target="_blank">
                                                    <img src="https://maimaidx-eng.com/maimai-mobile/img/btn_save.png" class="m_t_5 p_l_5 f_l w_112">
                                                </a>
                                            </div>
                                            <div class="col2 f_r">
                                                <div class="see_through_block m_3 p_r_5 t_r f_11 break">$\{record.storeName ?? "NO RECORD IN EXTEND DB"}</div>
                                            </div>
                                            <div class="clearfix"></div>
                                        </div>
                                    </div>
                                \`;
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