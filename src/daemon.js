import db from "./database.js";
import * as cheerio from "cheerio";
import { axiosInstance, saveCookie } from "./cookie.js";
import fs from "fs";

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

            const level = $(".playlog_diff").attr("src").match(/diff_(\w+)\.png/)[1];
            const trackNum = parseInt($(".sub_title .red").text().match(/TRACK (\d+)/)[1]);
            const datetime = new Date($(".sub_title span:not(.red)").text().trim() + " GMT+0900");
            const songname = $(".basic_block.m_5.p_5.p_l_10.f_13.break").text().trim();
            const clear = $("basic_block>img").length > 0 ? true : false;
            const kind = $(".playlog_music_kind_icon").attr("src").match(/music_(\w+)\.png/)[1];
            const coverSrc = $(".music_img").attr("src");
            const achievement = $(".playlog_achievement_txt").text().trim();
            const newrecord = $(".playlog_achievement_newrecord").length > 0 ? true : false;
            const scorerank = $(".playlog_scorerank").attr("src").match(/playlog\/(\w+)\.png/)[1];


            const [deluxscore, deluxscoreTotal, maxcombo, maxcomboTotal, maxsync, maxsyncTotal] = $(".playlog_score_block div").map((index, element) => {
                return $(element).text().split("/").map((val) => parseInt(val.replace(/[^\d]/g, "")));
            }).toArray();
            const deluxscoreNewrecord = $(".playlog_deluxscore_newrecord").length > 0 ? true : false;
            const slot1 = $(".playlog_result_innerblock>img").first().attr("src").match(/playlog\/(\w+)\.png/)[1];
            const slot2 = $(".playlog_result_innerblock>img").eq(1).attr("src").match(/playlog\/(\w+)\.png/)[1];

            const matchingIcon = $(".playlog_matching_icon");
            const matchingRank = matchingIcon.length > 0 ? $(".playlog_matching_icon").attr("src").match(/playlog\/(\w+)\.png/)[1] : null;

            const charas = $(".playlog_chara_container").map((index, element) => {
                const chara = $(element);
                const id = chara.find(".chara_cycle_img").attr("src").match(/\/(\w+)\.png/)[1];
                const star = parseInt(chara.find(".playlog_chara_star_block").text().match(/(\d+)/)[1]);
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

            const rating = parseInt($(".rating_block").text());
            const ratingChange = parseInt($(".playlog_rating_detail_block span").text().match(/([\+-]\d+)/)[1]);

            const matchs = $(".see_through_block>span").map((index, element) => {
                const container = $(element);
                if(container.hasClass("gray_block"))
                {
                    return null;
                }
                const matchLevel = container.attr("class").match(/playlog_(\w+)_container/)[1];
                const matchName = container.text().trim();
                return {
                    matchLevel,
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
                    level,
                    trackNum,
                    songname,
                    kind,
                    coverSrc,
                    achievement,
                    newrecord,
                    scorerank,
                    deluxscore,
                    deluxscoreTotal,
                    deluxscoreNewrecord,
                    slot1,
                    slot2,
                    matchingRank,
                    charas,
                    fast,
                    late,
                    detailsTable,
                    rating,
                    ratingChange,
                    matchs
                },
                finished: recordFetching === false
            });
        });
    });
}


function formatFilenameDatetime(date)
{
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");  // Months are 0-based in JS
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${yyyy}${mm}${dd}${hh}${min}`;
}


export default function startDaemon()
{
    // check photos
    setTimeout(async () => {
        const photoUrl = "https://maimaidx-eng.com/photo/";
        axiosInstance.get(photoUrl).then(async (res) => {
            let html;
            if(res.request.res.responseUrl !== photoUrl)
            {
                // error, try to relogin
                await axiosInstance.get("https://maimaidx-eng.com/").then((res) => {
                    if(new URL(res.request.res.responseUrl).hostname === "lng-tgk-aime-gw.am-all.net")
                    {
                        // login failed
                        throw new Error("Login failed when checking photos");
                    }
                });
                await axiosInstance.get(photoUrl).then((res) => {
                    html = res.data;
                });
            }
            else
            {
                html = res.data;
            }
            return html;
        }).then((html) => {
            const $ = cheerio.load(html);
            console.log($("title").text());
            const blocks = $(".m_10.p_5.f_0");
            const lastTime = new Date(db.data.lastPhotoTime);
            let newLastTime = lastTime;

            blocks.each(async (index, element) => {
                const block = $(element);
                const datetime = new Date(block.find("div.block_info").text().trim() + " GMT+0900");
                if(datetime <= lastTime)
                {
                    return;
                }
                if(datetime > newLastTime)
                {
                    newLastTime = datetime;
                }

                const songname = block.find(".black_block").text();
                const imgsrc = block.find("img.w_430").attr("src");
                const level = block.find("div.p_r.p_5").attr("class").match(/music_(\w+)_score_back/)[1];
                const kind = block.find("img.music_kind_icon").attr("src").match(/music_(\w+)\.png/)[1];
                const datetimeString = formatFilenameDatetime(datetime);
                const filename = `${datetimeString}_${imgsrc.split("/").pop()}.jpg`;
                db.data.photos.push({
                    datetime: datetime.toISOString(),
                    songname: songname,
                    level: level,
                    kind: kind,
                    filename: filename
                });
                console.log(`${datetime.toISOString()} ${songname} ${level} ${kind} ${imgsrc}`);

                const photoResponse = await axiosInstance.get(imgsrc, {
                    responseType: "arraybuffer"
                });

                const imageFileName = `photos/${filename}`;
                fs.writeFileSync(imageFileName, photoResponse.data);
            });

            if(newLastTime > lastTime)
            {
                db.data.lastPhotoTime = newLastTime.toISOString();
                db.data.photos = db.chain.get("photos").orderBy((e) => new Date(e.datetime), "desc").value();
                db.write();
            }
        }).catch((e) => {
            console.error(e);
        }).finally(() => {
            saveCookie();
        });
    }, 1000);

    // check records
    setInterval(async () => {
        const recordUrl = "https://maimaidx-eng.com/maimai-mobile/record/";
        axiosInstance.get(recordUrl).then(async (res) => {
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


                if(finished && newLastTime > lastTime)
                {
                    console.log("save records");
                    db.data.lastRecordTime = newLastTime.toISOString();
                    db.data.records = db.chain.get("records").orderBy((e) => new Date(e.datetime), "desc").value();
                    db.write();
                }
            });
        }).catch((e) => {
            console.error(e);
        }).finally(() => {
            saveCookie();
        });
    }, 1000 * 60 * 30);
};