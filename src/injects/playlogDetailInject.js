import Router from "../router.js";
import * as cheerio from "cheerio";
import db from "../database.js";

Router.register(/\/record\/playlogDetail\//, (req, html) => {
    const $ = cheerio.load(html);
    const datetime = new Date($(".sub_title span:not(.red)").text().trim() + " GMT+0900");
    const recordIdInt = datetime.getTime();

    const record = db.chain.get("records").find((r) => new Date(r.datetime).getTime() === recordIdInt).value();
    if(!record)
    {
        console.log("record miss");
        return $.html();
    }
    
    const diffDomString = `<span class="f_10" style="display: block;">${record.achievementDiff >= 0 ? "+" : "-"}${record.achievementDiff}%</span>`;
    $(".playlog_achievement_txt>.f_20").after(diffDomString);
    return $.html();
});