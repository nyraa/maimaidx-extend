import db from "../database.js";
import * as cheerio from "cheerio";
import { axiosInstance, saveCookie } from "../cookie.js";

import registerDaemon from "../daemon.js";


const recordQueue = [];
let recordFetching = false;
function getRecordDetails(href)
{
    return new Promise(async (resolve, reject) => {
        await new Promise((resolve, reject) => {
            if(recordFetching)
            {
                recordQueue.push(resolve);
            }
            else
            {
                recordFetching = true;
                resolve();
            }
        });
        axiosInstance.get(href).then((res) => {
            const $ = cheerio.load(res.data);

            const difficulty = $(".playlog_diff").attr("src").match(/diff_(\w+)\.png/)[1];
            const trackNum = parseInt($(".sub_title .red").text().match(/TRACK (\d+)/)[1]);
            const datetime = new Date($(".sub_title span:not(.red)").text().trim() + " GMT+0900");
            const songname = $(".basic_block.m_5.p_5.p_l_10.f_13.break").contents().filter(function() {
                return this.type === "text";
            }).text().trim();
            let kind, utageKind;
            if(difficulty === "utage")
            {
                utageKind = $(".p_r.t_c").map((index, element) => {
                    const icon = $(element).find("img").attr("src").match(/\/img\/music_(\w+)\.png/)[1];
                    const text = $(element).find(".playlog_music_kind_icon_utage_text").text();
                    return {
                        icon,
                        text
                    };
                }).toArray();
            }
            else
            {
                kind = $(".playlog_music_kind_icon").attr("src").match(/music_(\w+)\.png/)[1];
            }
            const coverSrc = $(".music_img").attr("src");
            const achievement = parseFloat($(".playlog_achievement_txt").text().trim());
            const newrecord = $(".playlog_achievement_newrecord").length > 0 ? true : false;
            const scorerank = $(".playlog_scorerank").attr("src").match(/playlog\/(\w+)\.png/)[1];


            const [deluxscore, deluxscoreTotal, maxcombo, maxcomboTotal, maxsync, maxsyncTotal] = $(".playlog_score_block div").map((index, element) => {
                const text = $(element).text();
                if(text === "―")
                    return [null, null];
                return $(element).text().split("/").map((val) => parseInt(val.replace(/[^\d]/g, "")));
            }).toArray();
            const deluxscoreNewrecord = $(".playlog_deluxscore_newrecord").length > 0 ? true : false;

            const deluxscoreStar = parseInt($(".playlog_deluxscore_star").attr("src")?.match(/dxstar_(\d+)\.png/)?.[1] ?? 0);

            const slot1 = $(".playlog_result_innerblock>img").first().attr("src").match(/playlog\/(\w+)\.png/)[1];
            const slot2 = $(".playlog_result_innerblock>img").eq(1).attr("src").match(/playlog\/(\w+)\.png/)[1];

            const matchingIcon = $(".playlog_matching_icon");
            const matchingRank = matchingIcon.length > 0 ? $(".playlog_matching_icon").attr("src").match(/playlog\/(\w+)\.png/)[1] : null;

            const challengeBlock = $(".p_r.m_t_5.f_l.f_0");
            let perfectChallenge;
            let courseChallenge;    // 段位認定
            if(challengeBlock.length > 0)
            {
                let challengeBadge = challengeBlock.find("img.h_30.p_l_5").attr("src").match(/icon_(\w+)\.png/)[1];
                const [lifeLeft, lifeTotal] = challengeBlock.find(".playlog_life_block").text().split("/").map((val) => parseInt(val.replace(/[^\d]/g, "")));
                const challengeLife = {
                    lifeLeft,
                    lifeTotal
                }
                if(challengeBadge === "perfectchallenge")
                {
                    perfectChallenge = challengeLife;
                }
                else if(challengeBadge === "course")
                {
                    courseChallenge = challengeLife;
                }
            }

            const charas = $(".playlog_chara_container").map((index, element) => {
                const chara = $(element);
                const id = chara.find(".chara_cycle_img").attr("src").match(/\/(\w+)\.png/)[1];
                const star = parseInt(chara.find(".collection_chara_awakening_block_txt ").text().match(/(\d+)/)[1]);
                const level = parseInt(chara.find(".playlog_chara_lv_block").text().match(/(\d+)/)[1]);
                return {
                    id,
                    star,
                    level
                };
            }).toArray();

            const [fast, late] = $(".playlog_fl_block>div").map((index, element) => parseInt($(element).text())).toArray();

            const detailsTable = $(".playlog_notes_detail tr:not(:first-child)").map((index, element) => {
                return new Array($(element).find("td").map((index, element) => parseInt($(element).text())).toArray().map((e) => isNaN(e) ? null : e));
            }).toArray().reduce((obj, val, index) => {
                obj[["tap", "hold", "slide", "touch", "break"][index]] = val;
                return obj;
            }, {});

            const ratingFrame = $(".p_r.p_3.p_l_0.f_l img").attr("src").match(/rating_base_(\w+)\.png/)[1];
            const rating = parseInt($(".rating_block").text());
            const ratingChange = parseInt($(".playlog_rating_detail_block span").text().match(/([\+-]\d+)/)[1]);

            const matchs = $(".see_through_block>span").map((index, element) => {
                const container = $(element);
                if(container.hasClass("gray_block"))
                {
                    return null;
                }
                const matchDifficulty = container.attr("class").match(/playlog_(\w+)_container/)[1];
                const matchName = container.text().trim();
                return {
                    matchDifficulty,
                    matchName
                };
            }).toArray();

            if(recordQueue.length === 0)
            {
                recordFetching = false;
            }
            else
            {
                setTimeout(() => {
                    recordQueue.shift()();
                }, 2000);
            }

            resolve({
                details: {
                    datetime,
                    difficulty,
                    trackNum,
                    songname,
                    kind,
                    utageKind,
                    coverSrc,
                    achievement,
                    newrecord,
                    scorerank,
                    deluxscore,
                    deluxscoreTotal,
                    deluxscoreNewrecord,
                    deluxscoreStar,
                    slot1,
                    slot2,
                    matchingRank,
                    perfectChallenge,
                    courseChallenge,
                    charas,
                    fast,
                    late,
                    detailsTable,
                    ratingFrame,
                    rating,
                    ratingChange,
                    maxcombo,
                    maxcomboTotal,
                    maxsync,
                    maxsyncTotal,
                    matchs
                },
                finished: recordFetching === false
            });
        });
    });
}

function diffSinceLastPlay(db)
{
    const records = db.data.records;
    const processedRecords = [];

    // cache with key: songname_kind
    const bestScoreCache = {};
    while(records.length > 0)
    {
        // pop oldest record as old
        const oldest = records.pop();
        const songKey = `${oldest.songname}_${oldest.kind ?? oldest.difficulty}_${oldest.difficulty}`;
        // find best from cache
        let best = bestScoreCache[songKey] ?? 0;
        const newBest = oldest.achievement;
        // update record
        oldest.achievementDiff = Math.round(newBest * 10000 - best * 10000) / 10000;
        // update cache
        if(best < newBest)
        {
            bestScoreCache[songKey] = newBest;
        }
        // add to processed records
        processedRecords.unshift(oldest);
    }
    db.data.records = processedRecords;
}

function runDaemon(dryrun = false)
{
    const recordUrl = "https://maimaidx-eng.com/record/";
    return axiosInstance.get(recordUrl).then(async (res) => {
        return res.data;
    }).then((html) => {
        const $ = cheerio.load(html);
        console.log($("title").text());
        const blocks = $(".p_10.t_l.f_0.v_b");
        const lastTime = new Date(db.data.lastRecordTime);
        let newLastTime = lastTime;

        blocks.each(async (index, element) => {
            const block = $(element);
            const blockDatetime = new Date(block.find(".sub_title span:not(.red)").text().trim() + " GMT+0900");

            if(blockDatetime <= lastTime)
            {
                return;
            }
            if(blockDatetime > newLastTime)
            {
                console.log("time updated");
                newLastTime = blockDatetime;
            }


            const detailsHref = `https://maimaidx-eng.com/maimai-mobile/record/playlogDetail/?idx=${encodeURIComponent(block.find('input[name="idx"]').attr("value"))}`;
            const {details, finished} = await getRecordDetails(detailsHref);
            db.data.records.push(details);
            console.log(details);


            if(finished && newLastTime > lastTime || dryrun)
            {
                db.data.lastRecordTime = newLastTime.toISOString();
                db.data.records = db.chain.get("records").orderBy((e) => new Date(e.datetime), "desc").value();
                // calc diff since last play
                diffSinceLastPlay(db);
                if(!dryrun)
                {
                    console.log("save records");
                    db.write();
                }
                else
                {
                    console.log("dryrun");
                }
            }
        });
    }).catch((e) => {
        if(e.response)
        {
            console.log("Record fetch error: ")
            console.log(e.response.status);
        }
        else
        {
            console.error(e);
        }
    }).finally(() => {
        saveCookie();
    });
}

registerDaemon(20, 0, runDaemon);