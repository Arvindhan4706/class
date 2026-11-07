// server/jobs/backup.js — automated database backups
import fs from "node:fs";
import path from "node:path";
import { db } from "../db.js";
import { ROOT, settings } from "../config.js";

const BACKUP_DIR = path.join(ROOT, "data", "backups");

export function setupBackupJob() {
  // Lazy import node-cron only if installed
  import("node-cron").then(({ default: cron }) => {
    // Run at 02:00 IST every night (20:30 UTC)
    cron.schedule("30 20 * * *", () => runBackup(), { timezone: "Asia/Kolkata" });
    console.log("[backup] Nightly backup job scheduled.");
  }).catch(() => {
    console.warn("[backup] node-cron not available — skipping backup job setup.");
  });
}

export function runBackup() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    // WAL checkpoint before backup
    db.pragma("wal_checkpoint(TRUNCATE)");
    const dateStr = new Date().toISOString().slice(0, 10);
    const dest = path.join(BACKUP_DIR, `nritya-${dateStr}.db`);
    fs.copyFileSync(settings.dbFile, dest);
    console.log(`[backup] Created: ${dest}`);
    pruneOldBackups();
    return dest;
  } catch (e) {
    console.error("[backup] Backup failed:", e.message);
    throw e;
  }
}

function pruneOldBackups() {
  const retain = settings.backupRetainDays || 30;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.match(/^nritya-\d{4}-\d{2}-\d{2}\.db$/))
    .sort();
  while (files.length > retain) {
    const old = files.shift();
    fs.unlinkSync(path.join(BACKUP_DIR, old));
    console.log(`[backup] Pruned old backup: ${old}`);
  }
}

export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.match(/^nritya-\d{4}-\d{2}-\d{2}\.db$/))
    .sort()
    .reverse()
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
    }));
}
