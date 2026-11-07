// server/lib/migrations.js
import fs from "node:fs";
import path from "node:path";
import { db } from "../db.js";
import { ROOT } from "../config.js";

const MIGRATIONS_DIR = path.join(ROOT, "server", "migrations");

export function runMigrations() {
  // Track which migrations have been applied
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = db.prepare("SELECT 1 FROM _migrations WHERE name=?").get(file);
    if (already) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

    // Run each statement that could fail independently (ALTER TABLE may fail if column exists)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        db.exec(stmt + ";");
      } catch (e) {
        // Ignore "duplicate column" errors from ALTER TABLE (idempotent migrations)
        if (e.message && (e.message.includes("duplicate column") || e.message.includes("already exists"))) {
          continue;
        }
        throw e;
      }
    }

    db.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES (?)").run(file);
    console.log(`[migration] Applied: ${file}`);
  }
}
