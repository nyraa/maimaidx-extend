import Router from "../router.js";
import * as cheerio from "cheerio";

Router.register(/.*/, (req, html) => {
    const $ = cheerio.load(html);
    $('a[href^="https://maimaidx-eng.com/"]').each((index, element) => {
        const origHref = $(element).attr("href");
        const newHref = origHref.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("href", newHref);
    });

    // replace form action
    $('form[action^="https://maimaidx-eng.com/"]').each((index, element) => {
        const origAction = $(element).attr("action");
        const newAction = origAction.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("action", newAction);
    });


    // replace back url
    $('button[onclick^="location.href=\'https://maimaidx-eng.com/"]').each((index, element) => {
        $(element).attr("onclick", "location.href='/'");
    });

    let replacedHtml = $.html();
    replacedHtml = replacedHtml.replace(/<!-- Google tag \(gtag\.js\) -->(\n|.)*?<!-- End Google tag \(gtag.js\) -->/, "");
    replacedHtml = replacedHtml.replace(/<!-- Google Tag Manager -->(.|\n)*?<!-- End Google Tag Manager -->/, "");
    replacedHtml = replacedHtml.replace(/<!-- Google Tag Manager \(noscript\) -->(.|\n)*?<!-- End Google Tag Manager \(noscript\) -->/, "");
    return replacedHtml;
});