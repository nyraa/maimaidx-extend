/* const axios = require("axios");
const {wrapper} = require("axios-cookiejar-support");
const {CookieJar} = require("tough-cookie"); */

import axios from "axios";
import {wrapper} from "axios-cookiejar-support";
import {CookieJar} from "tough-cookie";
import * as http from "http";
import querystring from "querystring";


// load cookie
const cookieFileName = "data/cookie.json";

let cookieJar;
try
{
    const cookieFile = Bun.file(cookieFileName);
    let cookieString = await cookieFile.text();
    cookieJar = CookieJar.fromJSON(cookieString);
}
catch(e)
{
    cookieJar = new CookieJar();
}

cookieJar.setCookieSync("test=foo, Path=/", "https://apichallenges.herokuapp.com/mirror/request");


const axiosInstance = wrapper(axios.create({
    withCredentials: true,
    jar: cookieJar,
}));

const maimaidxUrl = "https://maimaidx-eng.com";

const server = http.createServer(async (req, res) => {
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
            console.log(postBody);
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

            console.log(cookieJar.toJSON());

            const lastUrl = new URL(loginResponse.request.res.responseUrl);
            console.log(lastUrl);
            if(!lastUrl.hostname !== "lng-tgk-aime-gw.am-all.net") // login success
            {
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
                proxyResponse = await axiosInstance.post(maimaidxUrl + req.url, req.body);
            }
            else
            {
                res.writeHead(405, {"Content-Type": "text/plain"});
                res.end("405 Method Not Allowed");
            }
        }
        catch(e)
        {
            proxyResponse = e.response;
        }
        res.writeHead(proxyResponse.status, proxyResponse.headers);
        res.end(proxyResponse.data);
    }
});

server.listen(6895);