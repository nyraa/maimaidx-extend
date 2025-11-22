import Router from "../router.js";
import * as cheerio from "cheerio";
import db from "../database.js";
import { getCacheFileSync } from "../cache.js";
import { getLevel } from "../rating.js";

// inject play log detail page
Router.register(/\/record\/playlogDetail\//, (req, html) => {
    const $ = cheerio.load(html);

    // inject chievement analysis
    $("body").append(`
        <script language="javascript">
            ${getCacheFileSync("src/injects/client/achievementLostAnalysis.js.txt")}
        </script>
    `);
    $("head").append(`
        <style>
            ${getCacheFileSync("src/injects/client/achievementLostAnalysis.css")}
        </style>
    `);

    // get play time as record id
    const datetime = new Date($(".sub_title span:not(.red)").text().trim() + " GMT+0900");
    const recordIdInt = datetime.getTime();

    // inject achievement diff
    const record = db.chain.get("records").find((r) => new Date(r.datetime).getTime() === recordIdInt).value();
    if(!record)
    {
        console.log(`Record miss ${datetime.toDateString()}`);
    }
    else
    {
        const diffDomString = `<span class="f_10" style="display: block;">${record.achievementDiff >= 0 ? "+" : "-"}${record.achievementDiff.toFixed(4)}%</span>`;
        $(".playlog_achievement_txt>.f_20").after(diffDomString);
    }

    // inject level decimal
    const songname = $(".basic_block.m_5.p_5.p_l_10.f_13.break").contents().filter(function() {
        return this.type === "text";
    }).text().trim() || "\u3000";
    // \u3000 for x0o0x empty name song
    const difficulty = $(".playlog_diff").attr("src").match(/diff_(\w+)\.png/)[1];
    if(difficulty !== "utage")
    {
        const kind = $(".playlog_music_kind_icon").attr("src").match(/music_(\w+)\.png/)[1];
        const levelDecimal = getLevel(songname, kind, difficulty);
        if(levelDecimal !== 0)
        {
            $(".music_lv_back").text(levelDecimal.toFixed(1));
        }
    }

    return $.html();
});