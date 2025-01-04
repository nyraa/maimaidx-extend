import Router from "../router.js";
import * as cheerio from "cheerio";

import { isRatingAvailable, calculateRating } from "../rating.js";

if(isRatingAvailable())
{
    Router.register(/\/home\/ratingTargetMusic\/$/, (req, html) => {
        const $ = cheerio.load(html);
        const songBlocks = $(".pointer.w_450.m_15.p_3.f_0").slice(0, 50);
        let totalRating = 0;
        songBlocks.each((i, e) => {
            const element = $(e);
            const difficulty = element.attr("class").split("_")[1];
            const songName = element.find(".music_name_block").text();
            const achievement_text = element.find(".music_score_block").text();
            const achievement = parseInt(achievement_text.replace(/[^0-9]/g, ""));
            const songKind = element.find(".music_kind_icon").attr("src").match(/\/music_(\w+).png/)[1];
            const {rate, theoryRate} = calculateRating(songName, songKind, difficulty, achievement);
            element.find(".music_name_block").after(`
                <div class="music_score_block w_120 f_l f_12 t_l">
                    ${rate}/${theoryRate}<span class="red"> (-${theoryRate - rate})</span>
                </div>    
            `);
            totalRating += rate;
        });
        // console.log("Total Rating:", totalRating);
        return $.html();
    });
}