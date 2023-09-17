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

export default db;