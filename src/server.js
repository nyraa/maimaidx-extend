/* const axios = require("axios");
const {wrapper} = require("axios-cookiejar-support");
const {CookieJar} = require("tough-cookie"); */

import * as http from "http";
import querystring from "querystring";
import fs from "fs";

// html inject router
import Router from "./router.js";

// database
import db from "./database.js";

import { axiosInstance, saveCookie } from "./cookie.js";

// inject
import "./injects/photosInject.js";
import "./injects/generalInject.js";
import "./injects/recordInject.js";


// start Daemon
import startDaemon from "./daemon.js";
startDaemon();

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
                saveCookie();

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
    else if(req.url.startsWith("/extend"))
    {
        if(req.url.startsWith("/extend/photoproxy/"))
        {
            // SITE/extend/photo/user/ID
            // TODO get /user/ID
            const userIdPath = req.url.replace("/extend/photoproxy/", "");
            const targetUrl = maimaidxUrl + "/maimai-mobile/img/photo/" + userIdPath;

            try
            {
                const proxyResponse = await axiosInstance.get(targetUrl, {
                    responseType: "arraybuffer"
                });

                // save photo image proxy cookie
                saveCookie();
                res.writeHead(proxyResponse.status, {
                    "Content-Type": proxyResponse.headers["content-type"],
                    "Expires": -1,
                    "Cache-Control": "no-cache"
                });
                res.end(proxyResponse.data);
            }
            catch(e)
            {
                console.error(e);
                res.writeHead(502, {
                    "Content-Type": "text/plain"
                });
                res.end("502 Bad Gateway");
                return;
            }
        }
        else if(req.url.startsWith("/extend/photofile/"))
        {
            const filename = req.url.split("/").pop().split("?")[0];
            const filesource = "./photos/" + filename;
            try
            {
                const data = fs.readFileSync(filesource);
                res.writeHead(200, {
                    "Content-Type": "image/jpeg",
                    "Expires": -1,
                    "Cache-Control": "no-cache"
                });
                res.end(data);
            }
            catch(e)
            {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.end("404 Not Found");
                return;
            }

        }
        else if(req.url.startsWith("/extend/photodata/"))
        {
            const url = new URL("http://localhost" + req.url);
            const offset = url.searchParams.get("offset");
            if(offset === null || isNaN(parseInt(offset)))
            {
                res.writeHead(400, {"Content-Type": "text/plain"});
                res.end("400 Bad Request");
                return;
            }
            const take = 10;
            const data = db.chain.get("photos").drop(offset).take(take).value();
            const response = {
                data: data,
                offset: parseInt(offset),
                next: data.length === take ? parseInt(offset) + take : null
            };

            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify(response));
        }
        else if(req.url.startsWith("/extend/recorddata/"))
        {
            const url = new URL("http://localhost" + req.url);
            const offset = url.searchParams.get("offset");
            if(offset === null || isNaN(parseInt(offset)))
            {
                res.writeHead(400, {"Content-Type": "text/plain"});
                res.end("400 Bad Request");
                return;
            }
            const take = 50;
            const data = db.chain.get("records").drop(offset).take(take).value();
            const response = {
                data: data,
                offset: parseInt(offset),
                next: data.length === take ? parseInt(offset) + take : null
            };

            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify(response));
        }
        else
        {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.end("404 Not Found");
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

            // save proxy cookie
            saveCookie();

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
            console.error(e);
            proxyResponse = e.response;
            if(proxyResponse === undefined)
            {
                res.writeHead(502, {
                    "Content-Type": "text/plain"
                });
                res.end("502 Bad Gateway");
                return;
            }
        }
        res.writeHead(proxyResponse.status, {
            "Content-Type": proxyResponse.headers["content-type"],
            "Expires": -1,
            "Cache-Control": "no-cache"
        });
        if(proxyResponse.status === 200)
        {
            const pathname = req.url.split("?")[0];
            const html = Router.route(pathname, req, proxyResponse.data);
            res.end(html);
        }
        else
        {
            res.end(proxyResponse.data);
        }
    }
});

server.listen(6895);