
import axios from "axios";
import {wrapper} from "axios-cookiejar-support";
import {CookieJar} from "tough-cookie";
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
    console.error(e);
    cookieJar = new CookieJar();
}


const axiosInstance = wrapper(axios.create({
    withCredentials: true,
    jar: cookieJar,
    headers: {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0"
    }
}));


function saveCookie()
{
    fs.writeFile(cookieFileName, JSON.stringify(cookieJar.toJSON(), null, 4), (err) => {
        if(err)
        {
            console.error(err);
        }
    });
}

export {axiosInstance, saveCookie};