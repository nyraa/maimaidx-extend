import Router from "../router.js";
import * as cheerio from "cheerio";
import recordDOMString from "./recordDOMString.js";

import { isRatingAvailable, calculateTheoryRatings, getTheoryRatingTable, calculateRating, getLevel } from "../rating.js";

function achivevmentToString(achieve)
{
    return achieve / 10000 + "%";
}

Router.register(/\/musicDetail\/$/, (req, html) => {
    const $ = cheerio.load(html);
    const musicIdentifier = {
        songName: $(".m_5.f_15.break").text().trim(),
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
            function viewmore(difficulty)
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
                            $(\`#$\{difficulty}_log_block\`).append(domstring);
                        }
                        viewmore_loading = false;
                    }
                };
                xhr.onerror = () => {
                    viewmore_loading = false;
                };
                xhr.send(JSON.stringify({
                    musicIdentifier: ${JSON.stringify(musicIdentifier)},
                    difficulty: difficulty
                }));
            }
            function toggleLogBlock(difficulty)
            {
                if(!viewmore_loaded[difficulty])
                {
                    if(viewmore_loading)
                    {
                        return;
                    }
                    viewmore_loaded[difficulty] = true;
                    viewmore(difficulty);
                }
                $(\`#\${difficulty}_log_block\`).toggle();
            }
        </script>
    `);
    const scoreBlocks = $(".music_basic_score_back, .music_advanced_score_back, .music_expert_score_back, .music_master_score_back, .music_remaster_score_back, .music_utage_score_back");
    scoreBlocks.each((i, e) => {
        const element = $(e);
        const difficulty = element.attr("class").split(" ").find((c) => c.includes("music_")).split("_")[1];
        const logBlockDOMString = `
            <div id="${difficulty}_log_block" style="display: none">
            </div>
        `;
        element.after(logBlockDOMString);
        element.attr("onclick", `toggleLogBlock("${difficulty}")`);
        element.attr("style", "cursor: pointer;");
    });

    if(isRatingAvailable())
    {
        const musicDetailTableRow = $(".music_detail_table tr");
        const ratingTable = getTheoryRatingTable();
        musicDetailTableRow.each((i, e) => {
            const tr = $(e);
            const difficulty = tr.find("button").attr("class").match(/music_(\w+)_btn/)[1];
            if(difficulty == "utage")
            {
                return;
            }
            const bestAchievementText = $(`#${difficulty} .music_score_block.w_120.d_ib.t_r.f_12`);
            const bestAchievement = bestAchievementText.length > 0 ? parseInt(bestAchievementText.text().replace(/[^0-9]/g, "")) : 0;
            const theoryRate = calculateTheoryRatings(musicIdentifier.songName, musicIdentifier.kind, difficulty);
            if(theoryRate == undefined)
            {
                tr.after(`
                    <tr class="t_r rating_table_${difficulty}" style="display: none">
                        <td class="p_5">-</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                `);
            }
            else
            {
                const myRating = calculateRating(musicIdentifier.songName, musicIdentifier.kind, difficulty, bestAchievement);
                let isMyBestMark = false;
                for (let i = ratingTable.length - 1; i >= 0; --i)
                {
                    if(!isMyBestMark && bestAchievement >= ratingTable[i].achieve)
                    {
                        tr.after(`
                            <tr class="t_r rating_table_${difficulty} orange" style="display: none">
                                <td class="p_5">${myRating.rank}</td>
                                <td>${achivevmentToString(bestAchievement)}</td>
                                <td>${myRating.rate}</td>
                            </tr>
                        `);
                        isMyBestMark = true;
                    }
                    const offsetDetail = ratingTable[i];
                    tr.after(`
                        <tr class="t_r rating_table_${difficulty}" style="display: none">
                            <td class="p_5">${offsetDetail.rank}</td>
                            <td>${achivevmentToString(offsetDetail.achieve)}</td>
                            <td>${theoryRate[i]}${!isMyBestMark ? `(+${theoryRate[i] - myRating.rate})` : ""}</td>
                        </tr>
                    `);
                }
            }
            tr.after(`
                <tr class="t_r rating_table_${difficulty} blue" style="display: none">
                    <td class="p_5">Rank</td>
                    <td>Achieve</td>
                    <td>Rating</td>
                </tr>
            `);
            const musicLvBack = tr.find(".music_lv_back");
            musicLvBack.attr("onclick", `$(".rating_table_${difficulty}").toggle()`);
            musicLvBack.attr("class", musicLvBack.attr("class") + " pointer");
            const lv = getLevel(musicIdentifier.songName, musicIdentifier.kind, difficulty);
            if(lv != 0)
            {
                musicLvBack.text(lv.toFixed(1));
            }
        });
    }
    return $.html();
});