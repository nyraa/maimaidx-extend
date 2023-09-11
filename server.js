/* const axios = require("axios");
const {wrapper} = require("axios-cookiejar-support");
const {CookieJar} = require("tough-cookie"); */

import axios from "axios";
import {wrapper} from "axios-cookiejar-support";
import {CookieJar} from "tough-cookie";
import * as http from "http";
import querystring from "querystring";
import * as cheerio from "cheerio";
import fs from "fs";


// load cookie
const cookieFileName = "data/cookie.json";

let cookieJar;
try
{
    const cookieString = fs.readFileSync(cookieFileName, "utf8");
    cookieJar = CookieJar.fromJSON(cookieString);
    console.log("Cookie loaded");
}
catch(e)
{
    cookieJar = new CookieJar();
}


const axiosInstance = wrapper(axios.create({
    withCredentials: true,
    jar: cookieJar,
}));

const maimaidxUrl = "https://maimaidx-eng.com";

const server = http.createServer(async (req, res) => {
    console.log(req.url, req.method);
    if(req.url === "/login")
    {
        if(req.method === "GET")
        {
            if(false)
            {
                // test login
            }
            else
            {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end(`
                    <form action="/login" method="POST">
                        <input type="text" name="username" placeholder="username" />
                        <input type="password" name="password" placeholder="password" />
                        <button type="submit">Login</button>
                    </form>
                `);
            }
        }
        else
        {
            // get login cookie
            const postBody = await new Promise((resolve, reject) => {
                let body = "";
                req.on("data", (chunk) => {
                    body += chunk.toString();
                });
                req.on("end", () => {
                    resolve(body);
                });
            }).then((body) => {
                return querystring.parse(body);
            });
            if(!postBody.username || !postBody.password)
            {
                res.writeHead(400, {"Content-Type": "text/plain"});
                res.end("400 Bad Request");
                return;
            }
            await axiosInstance.get("https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/");
            
            const loginResponse = await axiosInstance.post("https://lng-tgk-aime-gw.am-all.net/common_auth/login/sid/", `retention=1&sid=${postBody.username}&password=${postBody.password}`, {
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            });

            const lastUrl = new URL(loginResponse.request.res.responseUrl);
            console.log(lastUrl);
            if(!lastUrl.hostname !== "lng-tgk-aime-gw.am-all.net") // login success
            {
                // save login cookie
                fs.writeFile(cookieFileName, JSON.stringify(cookieJar.toJSON(), null, 4), (err) => {
                    if(err)
                    {
                        console.error(err);
                    }
                });

                // redirect to home
                res.writeHead(302, {"Location": lastUrl.pathname});
                res.end();
            }
            else
            {
                res.writeHead(401, {"Content-Type": "text/plain"});
                res.end("401 Unauthorized");
            }
        }
    }
    else
    {
        let proxyResponse;
        try
        {
            if(req.method === "GET")
            {
                proxyResponse = await axiosInstance.get(maimaidxUrl + req.url);
            }
            else if(req.method === "POST")
            {
                const postBody = await new Promise((resolve, reject) => {
                    let body = "";
                    req.on("data", (chunk) => {
                        body += chunk.toString();
                    });
                    req.on("end", () => {
                        resolve(body);
                    });
                });
                proxyResponse = await axiosInstance.post(maimaidxUrl + req.url, postBody);
            }
            else
            {
                res.writeHead(405, {"Content-Type": "text/plain"});
                res.end("405 Method Not Allowed");
            }
            const lastUrl = new URL(proxyResponse.request.res.responseUrl);
            if(lastUrl.hostname === "lng-tgk-aime-gw.am-all.net")
            {
                // redirect to login
                res.writeHead(302, {"Location": "/login"});
                res.end();
                return;
            }
        }
        catch(e)
        {
            proxyResponse = e.response;
        }
        res.writeHead(proxyResponse.status, proxyResponse.headers);
        if(proxyResponse.status === 200)
        {
            const $ = cheerio.load(proxyResponse.data);
            $('a[href^="https://maimaidx-eng.com/"]').each((index, element) => {
                const origHref = $(element).attr("href");
                const newHref = origHref.replace("https://maimaidx-eng.com/", "/");
                $(element).attr("href", newHref);
            });

            $('form[action^="https://maimaidx-eng.com/"]').each((index, element) => {
                const origAction = $(element).attr("action");
                const newAction = origAction.replace("https://maimaidx-eng.com/", "/");
                $(element).attr("action", newAction);
            });
            res.end($.html());
        }
        else
        {
            res.end(proxyResponse.data);
        }
    }
});

server.listen(6895);