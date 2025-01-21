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


const musicData = readData("const/MusicData.json");
const ratingTable = readData("const/RatingTable.json");
let theoryRatingTable;
let availableFlag = false;

if(musicData && ratingTable)
{
    availableFlag = true;
    theoryRatingTable = ratingTable;
    theoryRatingTable.push({ achieve: 1010000, offset: ratingTable[ratingTable.length - 1].offset, rank: ratingTable[ratingTable.length - 1].rank });
}
else
{
    console.warn("Rating data is not available.");
}

function isRatingAvailable()
{
    return availableFlag;
}

function getRatingTable()
{
    return ratingTable;
}

function getTheoryRatingTable()
{
    return theoryRatingTable;
}

const difficultyMap = {
    "basic": 0,
    "advanced": 1,
    "expert": 2,
    "master": 3,
    "remaster": 4,
};

function getLevel(songName, kind, difficulty)
{
    const level = musicData?.[songName]?.[kind]?.[difficultyMap[difficulty]];
    if(level == undefined)
    {
        return 0;
    }
    return level;
}

const theoryRateCache = {};

function calculateTheoryRatings(songName, kind, difficulty)
{
    const level = getLevel(songName, kind, difficulty);
    if(level == 0)
    {
        return undefined;
    }
    if(theoryRateCache[level] != undefined)
    {
        return theoryRateCache[level];
    }
    const theoryRates = [];
    for(let i = 0; i < theoryRatingTable.length; i++)
    {
        const offsetDetail = theoryRatingTable[i];
        const rate = Math.floor(level * offsetDetail.achieve * offsetDetail.offset / 10000000);
        theoryRates.push(rate);
    }
    theoryRateCache[level] = theoryRates;
    return theoryRates;
}

function calculateRating(songName, kind, difficulty, achievement)
{
    // limit the achievement
    achievement = achievement > ratingTable[ratingTable.length - 1].achieve ? ratingTable[ratingTable.length - 1].achieve : achievement;

    // find highest rating under the achievement
    let offset = 0;
    let rank;
    for(let i = ratingTable.length - 1; i >= 0; i--)
    {
        if(achievement >= ratingTable[i].achieve)
        {
            offset = ratingTable[i].offset;
            rank = ratingTable[i].rank;
            break;
        }
    }
    const level = getLevel(songName, kind, difficulty);
    const rate = Math.floor(level * achievement * offset / 10000000);
    const theoryRate = Math.floor(level * 1010000 * ratingTable[ratingTable.length - 1].offset / 10000000);
    return {
        rate,
        theoryRate,
        offset,
        rank
    }
}

export { isRatingAvailable, calculateRating, calculateTheoryRatings, getRatingTable, getTheoryRatingTable, getLevel };