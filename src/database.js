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
/* update DB
db.data.records = db.chain.get("records").map((e) => {
    e.achievement = parseFloat(e.achievement);
    return e;
}).value();
db.write();
console.log("db updated");
*/

export default db;