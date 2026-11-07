-- Phase 1: In-app notification inbox for the UI bell/notification centre
-- This is separate from the notifications outbox table in db.js which handles delivery
CREATE TABLE IF NOT EXISTS notification_inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  ref_id TEXT DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_inbox_user ON notification_inbox (user_id, is_read, created_at);

