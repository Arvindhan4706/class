// server/routes/notifications.js
// In-app notification inbox — Phase 1
// Reads from the notification_inbox table (UI bell); for delivery outbox see server/lib/notify.js
import { db } from "../db.js";
import { HttpError } from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function notificationRoutes(app, auth) {
  // ── GET /api/notifications?page=1&limit=20
  app.get("/api/notifications", auth, wrap(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const rows = db.prepare(
      `SELECT id, type, title, body, ref_id, is_read, created_at
       FROM notification_inbox
       WHERE user_id=?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).all(req.user.id, limit, offset);
    const { total } = db.prepare(
      "SELECT COUNT(*) AS total FROM notification_inbox WHERE user_id=?"
    ).get(req.user.id);
    res.json({ page, limit, total, notifications: rows });
  }));

  // ── GET /api/notifications/unread-count
  app.get("/api/notifications/unread-count", auth, wrap(async (req, res) => {
    const { count } = db.prepare(
      "SELECT COUNT(*) AS count FROM notification_inbox WHERE user_id=? AND is_read=0"
    ).get(req.user.id);
    res.json({ count });
  }));

  // ── PATCH /api/notifications/:id/read
  app.patch("/api/notifications/:id/read", auth, wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id) throw new HttpError(422, "Invalid notification id.");
    const row = db.prepare("SELECT user_id FROM notification_inbox WHERE id=?").get(id);
    if (!row) throw new HttpError(404, "Notification not found.");
    if (row.user_id !== req.user.id) throw new HttpError(403, "Access denied.");
    db.prepare("UPDATE notification_inbox SET is_read=1 WHERE id=?").run(id);
    res.json({ ok: true });
  }));

  // ── PATCH /api/notifications/read-all
  app.patch("/api/notifications/read-all", auth, wrap(async (req, res) => {
    db.prepare("UPDATE notification_inbox SET is_read=1 WHERE user_id=?").run(req.user.id);
    res.json({ ok: true });
  }));

  // ── DELETE /api/notifications/:id  (optional — nice to have)
  app.delete("/api/notifications/:id", auth, wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id) throw new HttpError(422, "Invalid notification id.");
    const row = db.prepare("SELECT user_id FROM notification_inbox WHERE id=?").get(id);
    if (!row) throw new HttpError(404, "Notification not found.");
    if (row.user_id !== req.user.id && req.user.role !== "admin") throw new HttpError(403, "Access denied.");
    db.prepare("DELETE FROM notification_inbox WHERE id=?").run(id);
    res.json({ ok: true });
  }));
}
