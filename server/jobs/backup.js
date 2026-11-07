// server/jobs/backup.js
// Nightly SQLite backup cron job — Phase 1
// Runs at 02:00 IST every night, copies the DB to data/backups/, prunes old backups.
import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";
import { db } from "../db.js";
import { ROOT, settings } from "../config.js";
import * as svc from "../service.js";

const BACKUP_DIR = path.join(ROOT, "data", "backups");

/** Create a timestamped copy of the SQLite database using better-sqlite3's backup() API. */
export async function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const datestamp = new Date().toISOString().slice(0, 10);
  const dest = path.join(BACKUP_DIR, `nritya-${datestamp}.db`);
  try {
    await db.backup(dest);
    console.log(`[backup] Created: ${dest}`);
    svc.audit("System", "Nightly backup created", dest);
    pruneOldBackups();
  } catch (err) {
    console.error("[backup] Backup failed:", err.message);
    svc.audit("System", "Backup FAILED", err.message);
  }
}

/** Remove backups older than settings.backupRetainDays. */
function pruneOldBackups() {
  const retainDays = settings.backupRetainDays;
  if (!retainDays || retainDays < 1) return;
  const cutoff = Date.now() - retainDays * 86_400_000;
  try {
    for (const f of fs.readdirSync(BACKUP_DIR)) {
      if (!f.endsWith(".db")) continue;
      const fp = path.join(BACKUP_DIR, f);
      if (fs.statSync(fp).mtimeMs < cutoff) {
        fs.unlinkSync(fp);
        console.log(`[backup] Pruned old backup: ${f}`);
      }
    }
  } catch (err) {
    console.error("[backup] Prune error:", err.message);
  }
}

/** Register the cron job. Call once at startup. */
export function setupBackupJob() {
  // "0 20 30 * * *" = 20:30 UTC = 02:00 IST (UTC+5:30)
  cron.schedule("30 20 * * *", () => {
    console.log("[backup] Starting nightly backup...");
    runBackup().catch((e) => console.error("[backup] Unexpected error:", e));
  }, { timezone: "UTC" });
  console.log("[backup] Nightly backup job scheduled (02:00 IST).");
}

