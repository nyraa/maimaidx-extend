import Router from "../router.js";
import * as cheerio from "cheerio";
import { mapData, numberWithCommas } from "../data/map.js";

Router.register(/\/(eventMapDetail)|(mapDetail)\//, (req, html) => {
    const $ = cheerio.load(html);
    const mapName = $(".mapdetail_name_block_inner").text().trim();
    const mapInfo = mapData[mapName];
    if(mapInfo && mapInfo.distance > 0)
    {
        const currentDistanceElement = $(".mapdetail_total");
        const currentDistance = parseInt(currentDistanceElement.text().trim().match(/((\d|,)+)/)[1].replace(",", ""));
        currentDistanceElement.text(`${numberWithCommas(currentDistance)} / ${numberWithCommas(mapInfo.distance)} Km`);
    }
    return $.html();
});
