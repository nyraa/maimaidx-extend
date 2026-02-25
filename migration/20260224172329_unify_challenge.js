/**
 * Migration: unify_challenge
 * Created at: 2026-02-24T09:23:29.705Z
 */
export default async function migrate(db) {
    db.data.records = db.chain.get("records").map((e) => {
        let challengeLife;
        let challengeType;  // badge name
        if (e.perfectChallenge)
        {
            challengeLife = e.perfectChallenge;
            challengeType = "perfectchallenge";
            delete e.perfectChallenge;
        }
        else if (e.courseChallenge)
        {
            challengeLife = e.courseChallenge;
            challengeType = "course";
            delete e.courseChallenge;
        }
        e.challengeLife = challengeLife;
        e.challengeType = challengeType;
        return e;
    }).value();
}
