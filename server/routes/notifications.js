// server/routes/notifications.js — in-app notification centre
import { db } from "../db.js";
import { HttpError } from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function notificationRoutes(app, auth) {
  // GET /api/notifications?page=1&limit=20
  app.get("/api/notifications", auth, wrap(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const rows = db.prepare(
      `SELECT id, channel, template, payload, status, sent_at, created_at
       FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(req.user.id, limit, offset);
    const { total } = db.prepare("SELECT COUNT(*) AS total FROM notifications WHERE user_id=?").get(req.user.id);
    res.json({ rows, total, page, limit });
  }));

  // GET /api/notifications/unread-count
  app.get("/api/notifications/unread-count", auth, wrap(async (req, res) => {
    const { count } = db.prepare(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND status='pending'"
    ).get(req.user.id);
    res.json({ count });
  }));

  // PATCH /api/notifications/:id/read
  app.patch("/api/notifications/:id/read", auth, wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    const row = db.prepare("SELECT user_id FROM notifications WHERE id=?").get(id);
    if (!row) throw new HttpError(404, "Notification not found.");
    if (row.user_id !== req.user.id) throw new HttpError(403, "Forbidden.");
    db.prepare("UPDATE notifications SET status='read' WHERE id=?").run(id);
    res.json({ ok: true });
  }));

  // PATCH /api/notifications/read-all
  app.patch("/api/notifications/read-all", auth, wrap(async (req, res) => {
    db.prepare("UPDATE notifications SET status='read' WHERE user_id=? AND status='pending'").run(req.user.id);
    res.json({ ok: true });
  }));
}
