import Router from "../router.js";
import * as cheerio from "cheerio";
import recordDOMString from "./recordDOMString.js";

Router.register(/\/musicDetail\/$/, (req, html) => {
    const $ = cheerio.load(html);
    const musicIdentifier = {
        coverID: $("img.w_180.m_5.f_l").attr("src").split("/").pop().split(".")[0],
        type: $(".basic_block .f_l.h_20").attr("src")?.split("/")?.pop()?.split(".")?.[0]?.split("_")?.[1] ?? "utage",
        utageKinds: $(".music_kind_icon_utage_text_detail").map((i, e) => {
            const element = $(e);
            return element.text();
        }).toArray(),
    };
    console.log(musicIdentifier);
    $("head").after(`
        <script language="javascript">
            let viewmore_offset = {
                basic: 0,
                advanced: 0,
                expert: 0,
                master: 0,
                remaster: 0,
                utage: 0
            };
            let viewmore_loading = false;
            function viewmore(level)
            {
                if(viewmore_loading || viewmore_offset[level] === null)
                {
                    return;
                }
                viewmore_loading = true;
                const xhr = new XMLHttpRequest();
            }
        </script>
    `);
    const scoreBlocks = $(".music_basic_score_back, .music_advanced_score_back, .music_expert_score_back, .music_master_score_back, .music_remaster_score_back, .music_utage_score_back");
    scoreBlocks.each((i, e) => {
        const element = $(e);
        const level = element.attr("class").split(" ").find((c) => c.includes("music_")).split("_")[1];
        const logBlockDOMString = `
            <div id="${level}_log_block">
                <button type="button" onclick="javascript:viewmore('${level}')" class="m_10">
                    <img src="https://maimaidx-eng.com/maimai-mobile/img/btn_more.png" class="w_84" />
                </button>
            </div>
        `;
        element.after(logBlockDOMString);
    });
    return $.html();
});