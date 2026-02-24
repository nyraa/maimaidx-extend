export default async function migrate(db) {
    // update DB achivement format for difference feature
    db.data.records = db.chain.get("records").map((e) => {
        e.achievement = parseFloat(e.achievement);
        return e;
    }).value();
}