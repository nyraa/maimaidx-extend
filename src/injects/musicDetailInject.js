import Router from "../router.js";
import * as cheerio from "cheerio";
import recordDOMString from "./recordDOMString.js";

Router.register(/\/musicDetail\/$/, (req, html) => {
    const $ = cheerio.load(html);
    const musicIdentifier = {
        coverID: $("img.w_180.m_5.f_l").attr("src").split("/").pop().split(".")[0],
        kind: $(".basic_block .f_l.h_20").attr("src")?.split("/")?.pop()?.split(".")?.[0]?.split("_")?.[1] ?? "utage",
        utageKinds: $(".music_kind_icon_utage_text_detail").map((i, e) => {
            const element = $(e);
            return element.text();
        }).toArray(),
    };
    $("head").after(`
        <script language="javascript">
            let viewmore_loaded = {
                basic: false,
                advanced: false,
                expert: false,
                master: false,
                remaster: false,
                utage: false
            };
            let viewmore_loading = false;
            function viewmore(level)
            {
                if(viewmore_loading)
                {
                    return;
                }
                viewmore_loading = true;
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/extend/recorddata/");
                xhr.setRequestHeader("Content-Type", "application/json");
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
                            $(\`#$\{level}_log_block\`).append(domstring);
                        }
                        viewmore_loading = false;
                    }
                };
                xhr.onerror = () => {
                    viewmore_loading = false;
                };
                xhr.send(JSON.stringify({
                    musicIdentifier: ${JSON.stringify(musicIdentifier)},
                    level: level
                }));
            }
            function toggleLogBlock(level)
            {
                if(!viewmore_loaded[level])
                {
                    if(viewmore_loading)
                    {
                        return;
                    }
                    viewmore_loaded[level] = true;
                    viewmore(level);
                }
                $(\`#\${level}_log_block\`).toggle();
            }
        </script>
    `);
    const scoreBlocks = $(".music_basic_score_back, .music_advanced_score_back, .music_expert_score_back, .music_master_score_back, .music_remaster_score_back, .music_utage_score_back");
    scoreBlocks.each((i, e) => {
        const element = $(e);
        const level = element.attr("class").split(" ").find((c) => c.includes("music_")).split("_")[1];
        const logBlockDOMString = `
            <div id="${level}_log_block" style="display: none">
            </div>
        `;
        element.after(logBlockDOMString);
        element.attr("onclick", `toggleLogBlock("${level}")`);
        element.attr("style", "cursor: pointer;");
    });
    return $.html();
});