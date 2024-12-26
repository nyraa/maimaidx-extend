import Router from "../router.js";
import * as cheerio from "cheerio";
import MusicData from "../../const/MusicData.json" assert {type: "json"};
import RatingTable from "../../const/RatingTable.json" assert {type: "json"};

function getLevel(songName, kind, difficulty)
{
    const song = MusicData[`${songName}_${kind}`];
    if(song == undefined)
    {
        return 0;
    }
    return song[difficulty].level;
}

function calculateRating(songName, kind, difficulty, achievement)
{
    // achievement in 0~101%
    achievement = achievement;
    // limit the achievement
    achievement = achievement > RatingTable[RatingTable.length - 1].achieve ? RatingTable[RatingTable.length - 1].achieve : achievement;

    // find highest rating under the achievement
    let offset = 0;
    for(let i = RatingTable.length - 1; i >= 0; i--)
    {
        if(achievement >= RatingTable[i].achieve)
        {
            offset = RatingTable[i].offset;
            break;
        }
    }
    const level = getLevel(songName, kind, difficulty);
    const rate = Math.floor(level * achievement * offset / 10000000);
    const theoryRate = Math.floor(level * 1010000 * RatingTable[RatingTable.length - 1].offset / 10000000);
    return {
        rate,
        theoryRate,
    }
}

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
    console.log("Total Rating:", totalRating);
    return $.html();
});