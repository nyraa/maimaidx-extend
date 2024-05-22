import Router from "../router.js";
import * as cheerio from "cheerio";

Router.register(/\/photo\/$/, (req, html) => {
    const $ = cheerio.load(html);

    // replace photo src
    $('img[src^="https://maimaidx-eng.com/maimai-mobile/img/photo/"]').each((index, element) => {
        const origSrc = $(element).attr("src");
        const newSrc = origSrc.replace("https://maimaidx-eng.com/maimai-mobile/img/photo/", "/extend/photoproxy/");
        $(element).attr("src", newSrc);
    });

    // tmp fix for utage frame
    $(".music__score_back").each((index, element) => {
        // replace "music__score_back" with class "music_utage_score_back"
        $(element).attr("class", $(element).attr("class").replace("music__score_back", "music_utage_score_back"));
        // log fix message to identify if this is still needed
        console.log("fixing utage frame");
    });

    // tmp fix for utage icon
    $('img[src^="https://maimaidx-eng.com/maimai-mobile/img/diff_.png"]').each((index, element) => {
        $(element).attr("src", "https://maimaidx-eng.com/maimai-mobile/img/diff_utage.png");
    });

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
                                        <div class="music_$\{record.level}_score_back p_r p_5">
                                            <img src="https://maimaidx-eng.com/maimai-mobile/img/music_$\{record.kind}.png" class="music_kind_icon f_r">
                                            <div class="block_info p_3 f_11 white">$\{formatter.format(new Date(record.datetime))}</div>
                                            <img src="https://maimaidx-eng.com/maimai-mobile/img/diff_$\{record.level}.png" class="h_16 f_l"><br>
                                            <div class="clearfix"></div>
                                            <div class="black_block w_430 m_3 m_b_5 p_5 t_l f_15 break">$\{record.songname}</div>
                                            <img src="/extend/photofile/$\{record.filename}" class="w_430">
                                            <div class="col2 f_l"></div>
                                            <div class="col2 f_r">
                                                <div class="see_through_block m_3 p_r_5 t_r f_11 break"></div>
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