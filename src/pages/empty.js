import * as cheerio from "cheerio";
import fs from "fs";

const skeleten = fs.readFileSync("src/pages/skeleten/empty.html", "utf8");

const backHtml = fs.readFileSync("src/pages/skeleten/back.html", "utf8");
const footerHtml = fs.readFileSync("src/pages/skeleten/footer.html", "utf8");
const scrollHtml = fs.readFileSync("src/pages/skeleten/scroll.html", "utf8");

export default function emptyPage(back=false, footer=true, scroll=true, title="maimai DX NET", header="", content="")
{
    const result = skeleten.replace("{{back}}", back ? backHtml : "").replace("{{footer}}", footer ? footerHtml : "").replace("{{scroll}}", scroll ? scrollHtml : "").replace("{{title}}", title).replace("{{header}}", header).replace("{{content}}", content);
    return result;
}