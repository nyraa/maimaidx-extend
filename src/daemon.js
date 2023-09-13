import db from "./database.js";
import * as cheerio from "cheerio";
import { axiosInstance, saveCookie } from "./cookie.js";
import fs from "fs";

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
                db.data.photos.push({
                    datetime: datetime.toISOString(),
                    songname: songname,
                    level: level,
                    kind: kind,
                });
                console.log(`${datetime.toISOString()} ${songname} ${level} ${kind} ${imgsrc}`);

                const photoResponse = await axiosInstance.get(imgsrc, {
                    responseType: "arraybuffer"
                });

                const imageFileName = `photos/${new URL(imgsrc).pathname.split("/").pop()}.jpg`;
                fs.writeFileSync(imageFileName, photoResponse.data);
            });

            if(newLastTime > lastTime)
            {
                db.data.lastPhotoTime = newLastTime.toISOString();
                db.write();
            }
        }).catch((e) => {
            console.error(e);
        }).finally(() => {
            saveCookie();
        });
    }, 1000);
};