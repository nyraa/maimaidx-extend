import * as http from "http";
import querystring from "querystring";
import fs from "fs";
import { getCacheFileSync } from "./cache.js";

import { verifyAccount, signJWT, verifyJWT } from "./secret.js";

// html inject router
import Router from "./router.js";

// database
import db from "./database.js";

import { axiosInstance, saveCookie } from "./cookie.js";

// rating
import { getLevel } from "./rating.js";

// inject
import "./injects/photosInject.js";
import "./injects/generalInject.js";
import "./injects/recordInject.js";
import "./injects/playlogDetailInject.js";
import "./injects/musicDetailInject.js";
import "./injects/playerDataInject.js";
import "./injects/ratingTargetMusicInject.js"; // comment out this line if you don't have related table

// pages
import recordPage from "./pages/recordDetails.js";

// start Daemon
import "./daemons/photoDaemon.js";
import "./daemons/recordDaemon.js";

const maimaidxUrl = "https://maimaidx-eng.com";

const manifestPath = "/static/manifest.json";
const serviceWorkerPath = "/service-worker.js";

const server = http.createServer(async (req, res) => {
    if (req.url !== manifestPath && req.url !== serviceWorkerPath)
    {
        console.log(req.url, req.method);
    }

    const cookie = req.headers.cookie?.split(";").reduce((obj, e) => {
        try
        {
            const [key, value] = e.split("=", 2);
            obj[key.trim()] = value.trim();
        }
        catch(exception)
        {
            console.log(e);
        }
        return obj;
    }, {});
    const token = cookie?.token;
    const [login, payload] = verifyJWT(token);

    if(req.url === "/login")
    {
        if(!login)
        {
            if(req.method === "GET")
            {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end(`
                    <form action="/login" method="POST">
                        <input type="text" name="account" placeholder="account" />
                        <input type="password" name="password" placeholder="password" />
                        <button type="submit">Login</button>
                    </form>
                `);
                return;
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
                }).then((body) => {
                    return querystring.parse(body);
                });
                if(!postBody.account || !postBody.password)
                {
                    res.writeHead(400, {"Content-Type": "text/plain"});
                    res.end("400 Bad Request");
                    return;
                }
                if(verifyAccount(postBody.account, postBody.password))
                {
                    console.log("login success");
                    const token = signJWT({account: postBody.account});
                    res.writeHead(302, {
                        "Location": "/",
                        "Set-Cookie": `token=${token}; Path=/; HttpOnly; Expires=${new Date(new Date().getTime() + 2147483647000).toUTCString()}`
                    });
                    res.end();
                }
                else
                {
                    console.log("login failed");
                    res.writeHead(401, {"Content-Type": "text/plain"});
                    res.end("401 Unauthorized");
                }
            }
            return;
        }
        else
        {
            res.writeHead(302, {"Location": "/"});
            res.end();
            return;
        }
    }
    if(req.url.startsWith("/static/"))
    {
        if(req.url.startsWith(manifestPath))
        {   
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(getCacheFileSync("./src/pwa/manifest.json"));
        }
    }
    else if(req.url === serviceWorkerPath)
    {
        res.writeHead(200, {
            "Content-Type": "application/javascript"
        });
        res.end(getCacheFileSync("./src/pwa/service-worker.js"));
    }
    else if(!login)
    {
        console.log("not login request");
        res.writeHead(302, {"Location": "/login"});
        res.end();
        return;
    }
    else if(req.url === "/loginsega")
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
                    <form action="/loginsega" method="POST">
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
        if(req.url.startsWith("/extend/photofile/"))
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
            const offset = parseInt(url.searchParams.get("offset"));
            if(isNaN(offset))
            {
                res.writeHead(400, {"Content-Type": "text/plain"});
                res.end("400 Bad Request");
                return;
            }
            const take = 10;
            const data = db.chain.get("photos").drop(offset).take(take).value();
            const response = {
                data: data,
                offset: offset,
                next: db.data.photos.length - offset - take > 0 ? offset + take : null
            };

            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify(response));
        }
        else if(req.url.startsWith("/extend/recorddata/"))
        {
            if(req.method === "GET")
            {
                const url = new URL("http://localhost" + req.url);
                const offset = parseInt(url.searchParams.get("offset"));
                if(isNaN(offset))
                {
                    res.writeHead(400, {"Content-Type": "text/plain"});
                    res.end("400 Bad Request");
                    return;
                }
                const take = 50;
                const data = db.chain.get("records").drop(offset).take(take).value().map((record) => {
                    record.level = getLevel(record.songname, record.kind, record.difficulty);
                    return record;
                });
                const response = {
                    data: data,
                    offset: offset,
                    next: db.data.records.length - offset - take > 0 ? offset + take : null
                };

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify(response));
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
                }).then((body) => {
                    return JSON.parse(body);
                });

                const musicIdentifier = postBody.musicIdentifier;

                const data = db.chain.get("records").filter((e) => {
                    if(musicIdentifier.coverID !== e.coverSrc.split("/").pop().split(".")[0])
                    {
                        return false;
                    }
                    if(e.kind && musicIdentifier.kind !== e.kind)
                    {
                        return false;
                    }
                    if(postBody.difficulty !== e.difficulty)
                    {
                        return false;
                    }
                    if(e.utageKinds && musicIdentifier.utageKinds.length > 0)
                    {
                        musicIdentifier.utageKinds.forEach((kind) => {
                            if(!e.utageKinds.find((e) => e.text === kind))
                            {
                                return false;
                            }
                        });
                    }
                    return true;
                }).value();

                const response = {
                    data: data,
                    offset: postBody.offset
                };

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify(response));
            }
        }
        else if(req.url.startsWith("/extend/playlogDetail/"))
        {
            const url = new URL("http://localhost" + req.url);
            const recordId = url.searchParams.get("idx");
            if(!recordId)
            {
                res.writeHead(400, {"Content-Type": "text/plain"});
                res.end("400 Bad Request");
                return;
            }
            const recordIdInt = parseInt(recordId);
            const record = db.chain.get("records").find((r) => new Date(r.datetime).getTime() === recordIdInt).value();
            if(!record)
            {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.end("404 Not Found");
                return;
            }
            record.level = getLevel(record.songname, record.kind, record.difficulty);
            const html = recordPage(record);

            res.writeHead(200, {
                "Content-Type": "text/html"
            });
            res.end(html);
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
                proxyResponse = await axiosInstance.get(maimaidxUrl + req.url, {
                    responseType: "arraybuffer",
                });
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
                proxyResponse = await axiosInstance.post(maimaidxUrl + req.url, postBody, {
                    responseType: "arraybuffer",
                    headers: {
                        "Content-Type": req.headers["content-type"]
                    }
                });
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
                res.writeHead(302, {"Location": "/loginsega"});
                res.end();
                return;
            }
        }
        catch(e)
        {
            console.error(e.response?.status, e.response?.statusText, e.config.url);
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

        // html inject
        let html = proxyResponse.data;
        const isError = proxyResponse.data.includes("<title>maimai DX NET－Error－</title>") || proxyResponse.data.includes("Sorry, servers are under maintenance.");
        if(proxyResponse.headers["content-type"].startsWith("text/html"))
        {
            const pathname = req.url.split("?")[0];
            html = Router.route(pathname, req, proxyResponse.data, isError);
        }
        res.end(html);
    }
});

server.listen(6895);