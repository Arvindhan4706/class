// server/routes/admin.js
// Admin-only utility routes — Phase 1
import fs from "node:fs";
import path from "node:path";
import { db } from "../db.js";
import { ROOT, settings } from "../config.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const adminOnly = (u) => { if (u.role !== "admin") throw new HttpError(403, "Admin access required."); };

const BACKUP_DIR = path.join(ROOT, "data", "backups");

export function adminRoutes(app, auth) {
  // ── GET /api/admin/backups
  app.get("/api/admin/backups", auth, wrap(async (req, res) => {
    adminOnly(req.user);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".db"))
      .sort()
      .reverse()
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { name: f, sizeBytes: stat.size, createdAt: stat.birthtime.toISOString() };
      });
    res.json({ backups: files });
  }));

  // ── POST /api/admin/backup  — trigger a manual backup immediately
  app.post("/api/admin/backup", auth, wrap(async (req, res) => {
    adminOnly(req.user);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const datestamp = new Date().toISOString().slice(0, 10);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dest = path.join(BACKUP_DIR, `nritya-${datestamp}-${timestamp}.db`);
    // SQLite online backup via better-sqlite3 backup() method
    await db.backup(dest);
    // Prune old backups beyond retainDays
    pruneBackups(settings.backupRetainDays);
    svc.audit(req.user.name, "Manual backup created", dest);
    res.json({ ok: true, file: path.basename(dest) });
  }));

  // ── POST /api/admin/invoicing/run  — manually trigger monthly invoice generation
  app.post("/api/admin/invoicing/run", auth, wrap(async (req, res) => {
    adminOnly(req.user);
    const { generateMonthlyInvoices } = await import("../jobs/invoicing.js");
    const result = await generateMonthlyInvoices();
    svc.audit(req.user.name, "Manual invoice run triggered", JSON.stringify(result));
    res.json({ ok: true, ...result });
  }));

  // ── GET /api/admin/stats  — quick dashboard counters
  app.get("/api/admin/stats", auth, wrap(async (req, res) => {
    adminOnly(req.user);
    const students = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='student' AND status='Active'").get().n;
    const teachers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='teacher' AND status='Active'").get().n;
    const batches = db.prepare("SELECT COUNT(*) AS n FROM records WHERE tbl='batches'").get().n;
    const pendingInvoices = db.prepare(
      "SELECT COUNT(*) AS n FROM records WHERE tbl='invoices' AND json_extract(data,'$[5]')='Pending'"
    ).get().n;
    const todayScans = db.prepare(
      "SELECT COUNT(*) AS n FROM attendance_scans WHERE scan_date=?"
    ).get(new Date().toISOString().slice(0, 10)).n;
    const correctionsPending = db.prepare(
      "SELECT COUNT(*) AS n FROM attendance_scans WHERE correction_requested=1"
    ).get().n;
    res.json({ students, teachers, batches, pendingInvoices, todayScans, correctionsPending });
  }));
}

/** Remove backups older than retainDays. */
export function pruneBackups(retainDays) {
  if (!retainDays || retainDays < 1) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const cutoff = Date.now() - retainDays * 86_400_000;
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    if (!f.endsWith(".db")) continue;
    const fp = path.join(BACKUP_DIR, f);
    try {
      if (fs.statSync(fp).mtimeMs < cutoff) fs.unlinkSync(fp);
    } catch (_) { /* ignore */ }
  }
}

