import fs from "fs";

const readData = (filePath) =>
{
    try
    {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    }
    catch(error)
    {
        if(error.code === "ENOENT")
        {
            console.error(`File not found: ${filePath}`);
        } else
        {
            console.error(`Error reading file: ${filePath}`);
        }
        return null;
    }
};

export default readData;