/* const axios = require("axios");
const {wrapper} = require("axios-cookiejar-support");
const {CookieJar} = require("tough-cookie"); */

import axios from "axios";
import {wrapper} from "axios-cookiejar-support";
import {CookieJar} from "tough-cookie";


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

// cookieJar.setCookieSync("clal=r2y80sgl5qtcdrpjsqno85j4qt1k1dynghkwnb8feobuccg08yul46bi85q8ywp3; Max-Age=2147483647; Expires=Fri, 28-Sep-2091 21:55:12 GMT; Path=/common_auth", "https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/");
cookieJar.setCookieSync("test=foo, Path=/", "https://apichallenges.herokuapp.com/mirror/request");


const axiosInstance = wrapper(axios.create({
    withCredentials: true,
    jar: cookieJar,
}));

const tmp = await axiosInstance.get("https://www.google.com");

console.log(cookieJar.toJSON());

const server = Bun.serve({
    port: 3300,
    async fetch(request) {
        // console.log(request.url);
        const url = new URL(request.url);
        if(url.pathname === "/login")
        {
            // request login page for cookie
            // let res = await axiosInstance.get("https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/");
            axiosInstance.get("https://apichallenges.herokuapp.com/mirror/request").then((res) => {
                console.log(res.data);
            });
            let res = await axiosInstance.get("https://apichallenges.herokuapp.com/mirror/request", {
                responseType: "text"
            });
            let tmp = await this.fetch("https://apichallenges.herokuapp.com/");
            console.log(tmp.status);
            // console.log(cookieJar.toJSON());
            return new Response(res.data);
        }
        else
        {
            return new Response(url.pathname);
        }
    }
});