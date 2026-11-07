// server/routes/admin.js — admin-only routes (backups, etc.)
import { listBackups, runBackup } from "../jobs/backup.js";
import { generateMonthlyInvoices } from "../jobs/invoicing.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function adminRoutes(app, auth) {
  const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") throw new HttpError(403, "Admin only.");
    next();
  };

  // GET /api/admin/backups
  app.get("/api/admin/backups", auth, adminOnly, wrap(async (req, res) => {
    res.json({ backups: listBackups() });
  }));

  // POST /api/admin/backup
  app.post("/api/admin/backup", auth, adminOnly, wrap(async (req, res) => {
    const dest = runBackup();
    svc.audit(req.user.name, "Manual backup created", dest);
    res.json({ ok: true, file: dest });
  }));

  // POST /api/admin/invoicing/run
  app.post("/api/admin/invoicing/run", auth, adminOnly, wrap(async (req, res) => {
    const count = generateMonthlyInvoices();
    svc.audit(req.user.name, "Manual invoice run", `${count} invoices`);
    res.json({ ok: true, created: count });
  }));
}
