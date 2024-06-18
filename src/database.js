import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import lodash from "lodash";

const dbName = "data/db.json";
const adapter = new JSONFile(dbName);
const db = new Low(adapter, {
    records: [],
    lastRecordTime: new Date(0).toISOString(),
    photos: [],
    lastPhotoTime: new Date(0).toISOString(),
});

await db.read();

db.chain = lodash.chain(db.data);
/* update DB achivement difference
db.data.records = db.chain.get("records").map((e) => {
    e.achievement = parseFloat(e.achievement);
    return e;
}).value();
db.write();
console.log("db updated");
*/
/* update DB delux score star
db.data.records = db.chain.get("records").map((e) => {
    const deluxscore = parseFloat(e.deluxscore);
    const deluxscoreTotal = parseFloat(e.deluxscoreTotal);
    if (deluxscoreTotal === 0) {
        e.deluxscoreStar = 0;
    } else if (deluxscore >= deluxscoreTotal * 0.97) {
        e.deluxscoreStar = 5;
    } else if (deluxscore >= deluxscoreTotal * 0.95) {
        e.deluxscoreStar = 4;
    } else if (deluxscore >= deluxscoreTotal * 0.93) {
        e.deluxscoreStar = 3;
    } else if (deluxscore >= deluxscoreTotal * 0.90) {
        e.deluxscoreStar = 2;
    } else if (deluxscore >= deluxscoreTotal * 0.85) {
        e.deluxscoreStar = 1;
    } else {
        e.deluxscoreStar = 0;
    }
    return e;
}).value();
db.write();
*/
export default db;