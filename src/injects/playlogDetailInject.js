import Router from "../router.js";
import * as cheerio from "cheerio";
import db from "../database.js";

// inject play log detail page
Router.register(/\/record\/playlogDetail\//, (req, html) => {
    const $ = cheerio.load(html);

    // get play time as record id
    const datetime = new Date($(".sub_title span:not(.red)").text().trim() + " GMT+0900");
    const recordIdInt = datetime.getTime();

    const record = db.chain.get("records").find((r) => new Date(r.datetime).getTime() === recordIdInt).value();
    if(!record)
    {
        console.log(`Record miss ${datetime.toDateString()}`);
        return $.html();
    }
    
    // inject achievement diff
    const diffDomString = `<span class="f_10" style="display: block;">${record.achievementDiff >= 0 ? "+" : "-"}${record.achievementDiff.toFixed(4)}%</span>`;
    $(".playlog_achievement_txt>.f_20").after(diffDomString);
    return $.html();
});