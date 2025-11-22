import db from "../database.js";
import * as cheerio from "cheerio";
import { axiosInstance, saveCookie } from "../cookie.js";
import fs from "fs";

import registerDaemon from "../daemon.js";


function formatFilenameDatetime(date)
{
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");  // Months are 0-based in JS
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${yyyy}${mm}${dd}${hh}${min}`;
}

function photoDaemonCallback(dryrun = false, dryrunAll = false)
{
    const photoUrl = "https://maimaidx-eng.com/playerData/photo/";
    axiosInstance.get(photoUrl).then(async (res) => {
        let html;
        if(res.request.res.responseUrl !== photoUrl)
        {
            // error, try to relogin
            console.log(`Photo daemon login failed, redirect to ${res.request.res.responseUrl}`);
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
        let lastTime = new Date(db.data.lastPhotoTime);
        if(dryrunAll)
        {
            lastTime = new Date(0);
        }
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

            const difficulty = block.find("div.p_r.p_5").attr("class").match(/music_(\w+)_score_back/)?.[1];

            let kind, utageKind;
            if(difficulty === "utage")
            {
                utageKind = $(".music_kind_icon_utage").map((index, element) => {
                    const tag = $(element);
                    const icon = tag.find("img").attr("src").match(/\/img\/music_(\w+)\.png/)[1];
                    const text = tag.find(".music_kind_icon_utage_text_photo").text();
                    return {
                        icon,
                        text
                    };
                }).toArray();
            }
            else
            {
                kind = block.find("img.music_kind_icon").attr("src").match(/music_(\w+)\.png/)[1];
            }
            const storeName = block.find(".see_through_block").text().trim();


            const datetimeString = formatFilenameDatetime(datetime);
            const filename = `${datetimeString}_${imgsrc.split("/").pop()}.jpg`;
            db.data.photos.push({
                datetime: datetime.toISOString(),
                songname: songname,
                difficulty: difficulty,
                kind: kind,
                utageKind: utageKind,
                storeName: storeName,
                filename: filename
            });
            console.log(`${datetime.toISOString()} ${songname} ${difficulty} ${kind} utage[${utageKind?.map((e) => e.text)?.join(" ")}] ${storeName} ${imgsrc}`);

            if(!dryrun)
            {
                const photoResponse = await axiosInstance.get(imgsrc, {
                    responseType: "arraybuffer"
                });
    
                const imageFileName = `photos/${filename}`;
                fs.writeFileSync(imageFileName, photoResponse.data);
            }
        });

        if(newLastTime > lastTime)
        {
            db.data.lastPhotoTime = newLastTime.toISOString();
            db.data.photos = db.chain.get("photos").orderBy((e) => new Date(e.datetime), "desc").value();
            if(!dryrun)
            {
                db.write();
            }
        }
    }).catch((e) => {
        if(e.response)
        {
            console.log("Photo fetch error: ")
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

registerDaemon(20, 10, photoDaemonCallback);