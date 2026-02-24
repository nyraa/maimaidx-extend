import fs from "fs";
import path from "path";

// get description from command line arguments
const args = process.argv[2];

if (!args || args.length === 0) {
    console.error("Please provide a migration description.");
    console.error('Usage: npm run migrate:create "add user table"');
    process.exit(1);
}

// join args with underscore and remove special characters to create a clean description for filename
const description = args.replace(/[^a-zA-Z0-9_]/g, "_");

// generate timestamp for filename
const now = new Date();
const pad = (n) => n.toString().padStart(2, "0");
const timestamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

// create filename with timestamp and description
const filename = `${timestamp}_${description}.js`;
const targetDir = path.join(process.cwd(), "migration");
const targetPath = path.join(targetDir, filename);

// define migration template
const template = `/**
 * Migration: ${description}
 * Created at: ${now.toISOString()}
 */
export default async function migrate(db) {
    // TODO: implement migration logic here
}
`;

// write template to target path
try {
    // create migration directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, template);
    console.log(`Migration created: migration/${filename}`);
} catch (error) {
    console.error("Failed to create migration file:", error);
}