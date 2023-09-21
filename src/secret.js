import bcrypt from "bcryptjs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;

const db = new Low(new JSONFile("data/secrets.json"), {
    jwtsecret: "",
    account: "",
    password: "",
});

await db.read();

function verifyAccount(account, password)
{
    if(account === db.data.account && bcrypt.compareSync(password, db.data.password))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function signJWT(payload)
{
    const token = sign(payload, db.data.jwtsecret, {});
    return token;
}

function verifyJWT(token)
{
    try
    {
        const decoded = verify(token, db.data.jwtsecret);
        return [true, decoded];
    }
    catch(err)
    {
        return [false, err];
    }
}

function setAccount()
{
    // require a input
    const account = process.argv[2];
    const password = process.argv[3];

    const hashPass = bcrypt.hashSync(password, 10);

    db.data.account = account;
    db.data.password = hashPass;
    db.write();
}

export { verifyAccount, signJWT, verifyJWT };