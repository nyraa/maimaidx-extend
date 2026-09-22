import Router from "../router.js";
import * as cheerio from "cheerio";
import { mapData } from "../data/map.js";

Router.register(/\/map\/(eventMap\/)?/, (req, html) => {
    const $ = cheerio.load(html);
    $("div:has(>.map_name_block)").each((i, e) => {
        const element = $(e);

        const mapName = element.find(".map_name_block_inner").text().trim();
        const mapInfo = mapData[mapName];
        if(mapInfo)
        {
            const currentDistanceElement = element.find(".basic_block").contents().filter(function() {
                return this.type === "text";
            })[0];
            const currentDistance = parseInt(currentDistanceElement.data.trim().match(/((\d|,)+)/)[1].replace(",", ""));
            currentDistanceElement.data = `${currentDistance} / ${mapInfo.distance > 0 ? mapInfo.distance : "\u221E"} Km`;
        }
    });
    return $.html();
});
