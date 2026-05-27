import { neon } from "@neondatabase/serverless";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadLocalEnv() {
  if (!existsSync(".env.local")) {
    return;
  }

  const lines = readFileSync(".env.local", "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Add it to .env.local or export it before running migrations.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const migrationsDir = "src/db/migrations";
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const migration = readFileSync(join(migrationsDir, file), "utf8");
  const statements = migration
    .split(";\n")
    .map((statement) => statement.trim())
    .filter(Boolean);

  console.log(`Applying ${file}`);

  for (const statement of statements) {
    await sql.query(`${statement};`);
  }
}

console.log("Database migrations complete.");
