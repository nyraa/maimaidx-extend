import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const dbName = "data/db.json";
const adapter = new JSONFile(dbName);
const db = new Low(adapter, {
    records: [],
    lastRecordTime: new Date(0).toISOString(),
    photos: [],
    lastPhotoTime: new Date(0).toISOString(),
});

await db.read();

export default db;