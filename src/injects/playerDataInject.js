import Router from "../router.js";
import * as cheerio from "cheerio";
import db from "../database.js";

Router.register(/\/playerData\/$/, (req, html) => {
    // count credits today
    const now = new Date();
    let creditsToday = 0;
    for(let record of db.data.records)
    {
        if(record.trackNum != 1)
            continue;
        let datetime = new Date(record.datetime);

        if(datetime.getDate() === now.getDate() && datetime.getMonth() === now.getMonth() && datetime.getFullYear() === now.getFullYear())
        {
            creditsToday++;
        }
        else
        {
            break;
        }
    }

    const $ = cheerio.load(html);
    const textarea = $(".m_5.m_b_5.t_r.f_12");
    textarea.html(textarea.html() + `<br>play count today：${creditsToday}`);
    console.log(`Credits today: ${creditsToday}`);
    return $.html();
});