import Database from "better-sqlite3";
import { settings } from "./config.js";

export const db = new Database(settings.dbFile);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 30000");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Active', linked TEXT NOT NULL DEFAULT '', perms TEXT NOT NULL DEFAULT '',
  pw_hash TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login TEXT
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, key TEXT NOT NULL, pos REAL NOT NULL DEFAULT 0, data TEXT NOT NULL,
  UNIQUE (tbl, key)
);
CREATE INDEX IF NOT EXISTS ix_record_tbl_pos ON records (tbl, pos);
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT ''
);
`);
