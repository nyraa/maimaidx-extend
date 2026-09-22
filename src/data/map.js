import readData from "./data.js";

const mapData = readData("const/MapData.json");

function numberWithCommas(x)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export { mapData, numberWithCommas };
