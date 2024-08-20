import fs from "fs";

const cache = {};

function getCacheFileSync(filename)
{
    if(cache[filename])
    {
        return cache[filename];
    }
    else
    {
        const data = fs.readFileSync(filename, "utf8");
        cache[filename] = data;
        return data;
    }
}
export { getCacheFileSync };