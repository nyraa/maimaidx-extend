import db from "./database.js";
import fs from "fs";
import path from "path";

const migrationFiles = fs.readdirSync(path.join(import.meta.dirname, "migration")).filter((file) => file.endsWith(".js")).sort();

// backup before migration
const backupDir = path.join(process.cwd(), "data", "backup");
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}
const backupFile = path.join(backupDir, `backup_${new Date().toISOString()}.json`);
// copy file
fs.copyFileSync(path.join(process.cwd(), "data", "db.json"), backupFile);
console.log(`Database backed up to ${backupFile}`);

db.data ||= {}; 
db.data.migrations ||= [];

const executedMigrations = new Set(db.data.migrations.map(m => m.file));
let executedCount = 0;

for (const file of migrationFiles) {
    if (executedMigrations.has(file)) continue;
    console.log(`Running migration: ${file}`);
    try
    {
        const migrate = (await import(path.join(import.meta.dirname, "migration", file))).default;
        await migrate(db);
        db.data.migrations.push({ file, date: new Date().toISOString() });
        await db.write();
    }
    catch(e)
    {
        console.error(`Error running migration ${file}:`, e);
        process.exit(1);
    }
    executedCount += 1;
    console.log(`Migration ${file} executed successfully.`);
}

console.log(`All migrations executed. Total executed: ${executedCount}`);
if (executedCount === 0)
{
    // remove backup file when no migration is executed
    fs.rmSync(backupFile);
    console.log(`No migration is executed, remove backup file ${backupFile}`);
}