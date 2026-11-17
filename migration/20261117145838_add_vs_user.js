/**
 * Migration: add_vs_user
 * Created at: 2026-11-17T06:58:38.163Z
 */
export default async function migrate(db) {
    db.data.records = db.chain.get("records").map((e) => {
        e.vsUser = e.vsUser || null;
        return e;
    }).value();
}
