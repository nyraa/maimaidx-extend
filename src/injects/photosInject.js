import Router from "../router.js";
import * as cheerio from "cheerio";

Router.register(/\/photo\/$/, (req, html) => {
    const $ = cheerio.load(html);

    // replace photo src
    $('img[src^="https://maimaidx-eng.com/maimai-mobile/img/photo/"]').each((index, element) => {
        const origSrc = $(element).attr("src");
        const newSrc = origSrc.replace("https://maimaidx-eng.com/maimai-mobile/img/photo/", "/extend/photo/");
        $(element).attr("src", newSrc);
    });

    
    return $.html();
});