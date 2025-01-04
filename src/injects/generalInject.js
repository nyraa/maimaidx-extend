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
        const origHref = $(element).attr("onclick");
        const newHref = origHref.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("onclick", newHref);
    });

    // replace css and js(jquery) url
    $('link[href^="https://maimaidx-eng.com/"][rel="stylesheet"]').each((index, element) => {
        const origHref = $(element).attr("href");
        const newHref = origHref.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("href", newHref);
    });
    $('script[src^="https://maimaidx-eng.com/"]').each((index, element) => {
        const origSrc = $(element).attr("src");
        const newSrc = origSrc.replace("https://maimaidx-eng.com/", "/");
        $(element).attr("src", newSrc);
    });

    // insert pwa manifest
    $('head').append('<link rel="manifest" href="/static/manifest.json" />');
    $('head').append(`
        <script language="javascript">
            if('serviceWorker' in navigator)
            {
                window.addEventListener('load', () =>
                {
                    navigator.serviceWorker.register('/service-worker.js')
                        .then(registration =>
                        {
                            console.log('Service Worker registered with scope:', registration.scope);
                        })
                        .catch(error =>
                        {
                            console.log('Service Worker registration failed:', error);
                        });
                });
            }
        </script>    
    `);

    let replacedHtml = $.html();
    replacedHtml = replacedHtml.replace(/<!-- Google tag \(gtag\.js\) -->(\n|.)*?<!-- End Google tag \(gtag.js\) -->/, "");
    replacedHtml = replacedHtml.replace(/<!-- Google Tag Manager -->(.|\n)*?<!-- End Google Tag Manager -->/, "");
    replacedHtml = replacedHtml.replace(/<!-- Google Tag Manager \(noscript\) -->(.|\n)*?<!-- End Google Tag Manager \(noscript\) -->/, "");
    replacedHtml = replacedHtml.replace(/\(function\(i,s,o,g,r,a,m\)(.|\n)*?ga\('send', 'pageview'\);/, "");
    return replacedHtml;
}, true);