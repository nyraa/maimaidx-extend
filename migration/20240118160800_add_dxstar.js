export default async function migrate(db) {
    // 2024/1/18: add dx score star
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
}