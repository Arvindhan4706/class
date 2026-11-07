// Business logic: who can read/write which rows, applying changes, payments, bootstrap payload.
import crypto from "node:crypto";
import { db } from "./db.js";
import { settings } from "./config.js";
import { IMG, ONLINE_METHODS, PERMS, PUBLIC_TABLES, ROLES, SETTINGS_KEYS, SITE_IMAGE_KEYS, SITE_KEYS, TABLES } from "./schema.js";

export const SEP = "\x1f";
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export class Reject extends Error {
  constructor(table, msg) { super(msg); this.table = table; this.msg = msg; }
}
export class HttpError extends Error {
  constructor(status, detail) { super(detail); this.status = status; this.detail = detail; }
}

// ---------------------------------------------------------------- time & money
function localParts(d = new Date()) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  return Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
}
export function todayIso(d = new Date()) {
  const p = localParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const validIso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;

export function fmtInr(n) {
  let s = String(Math.trunc(n));
  if (s.length > 3) {
    let head = s.slice(0, -3);
    const tail = s.slice(-3), parts = [];
    while (head.length > 2) { parts.unshift(head.slice(-2)); head = head.slice(0, -2); }
    if (head) parts.unshift(head);
    s = parts.join(",") + "," + tail;
  }
  return "₹" + s;
}
const amt = (s) => { const d = String(s).replace(/[^\d]/g, ""); return d ? parseInt(d, 10) : 0; };

// ---------------------------------------------------------------- storage helpers
export function getKv(k, def) {
  const r = db.prepare("SELECT v FROM kv WHERE k=?").get(k);
  return r ? JSON.parse(r.v) : def;
}
export function setKv(k, v) {
  db.prepare("INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, JSON.stringify(v));
}
export const rowsOf = (table) =>
  db.prepare("SELECT data FROM records WHERE tbl=? ORDER BY pos, id").all(table).map((r) => JSON.parse(r.data));
const keyOf = (table, row) => TABLES[table].key.map((i) => String(row[i])).join(SEP);
export function audit(actor, action, target = "") {
  db.prepare("INSERT INTO audit (ts,actor,action,target) VALUES (?,?,?,?)")
    .run(new Date().toISOString(), actor.slice(0, 120), action.slice(0, 200), String(target).slice(0, 2000));
}
const userRow = (u) => [u.id, u.name, u.role, u.email, u.status, u.linked, u.perms];
const getUser = (id) => db.prepare("SELECT * FROM users WHERE id=?").get(id);

/** Next free ID in the same format as `like` (STU010 -> STU011, INV-2026-11-004 -> INV-2026-11-005). */
export function nextId(table, like) {
  const m = /^(.*?)(\d+)$/.exec(like);
  if (!m) return like + "-1";
  const [, prefix, digits] = m;
  const keys = table === "users"
    ? db.prepare("SELECT id AS k FROM users").all()
    : db.prepare("SELECT key AS k FROM records WHERE tbl=?").all(table);
  let best = 0;
  for (const { k } of keys) {
    const mm = /^(.*?)(\d+)$/.exec(k);
    if (mm && mm[1] === prefix) best = Math.max(best, parseInt(mm[2], 10));
  }
  return prefix + String(best + 1).padStart(digits.length, "0");
}

// ---------------------------------------------------------------- per-request context
export class Ctx {
  constructor(user) {
    this.u = user;
    this.role = user.role;
    this.perms = user.role === "admin" || user.perms === "all"
      ? new Set(PERMS)
      : new Set(user.perms.split(",").map((p) => p.trim()).filter(Boolean));
    this._cache = {};
  }
  rows(t) { return (this._cache[t] ??= rowsOf(t)); }
  drop(t) { delete this._cache[t]; }
  has(p) { return this.role === "admin" || this.perms.has(p); }
  get isFamily() { return this.role === "student" || this.role === "parent"; }
  get kidIds() { return this.isFamily ? new Set(this.u.linked.split(",").map((x) => x.trim()).filter(Boolean)) : new Set(); }
  get kidNames() { const ids = this.kidIds; return new Set(this.rows("students").filter((s) => ids.has(s[0])).map((s) => s[1])); }
  get myBatches() {
    return this.role !== "teacher" ? new Set() : new Set(this.rows("batches").filter((b) => b[3] === this.u.linked).map((b) => b[1]));
  }
  myStudentRows() { const mb = this.myBatches; return this.rows("students").filter((s) => mb.has(s[2])); }

  // ---- reading
  visible(table) {
    const role = this.role;
    if (table === "users") {
      return role === "admin" ? db.prepare("SELECT * FROM users ORDER BY id").all().map(userRow) : [userRow(this.u)];
    }
    if (table === "audit") return [];
    const rows = this.rows(table);
    if (PUBLIC_TABLES.includes(table)) return table === "events" && !this.has("website") ? rows.filter((r) => r[4] !== "Draft") : rows;
    if (["tt", "batches", "teachers"].includes(table)) return rows;
    if (table === "announcements") return this.has("announcements") ? rows : rows.filter((r) => r[5] === "Published");
    if (table === "guardians" || table === "admissions") return this.has("students") ? rows : [];
    if (table === "notifications") return this.has("announcements") ? rows : [];
    if (table === "students") {
      if (this.isFamily) { const ids = this.kidIds; return rows.filter((r) => ids.has(r[0])); }
      if (this.has("students") || this.has("finance") || role === "admin") return rows;
      return role === "teacher" ? this.myStudentRows() : [];
    }
    if (table === "attendance") {
      const cutoff = addDays(todayIso(), -settings.attendanceWindowDays);
      const rs = rows.filter((r) => r[0] >= cutoff);
      if (this.isFamily) { const ids = this.kidIds; return rs.filter((r) => ids.has(r[2])); }
      if (!this.has("attendance")) return [];
      if (role === "teacher") { const mb = this.myBatches; return rs.filter((r) => mb.has(r[1])); }
      return rs;
    }
    if (table === "leave") {
      if (this.isFamily) { const n = this.kidNames; return rows.filter((r) => n.has(r[1])); }
      if (!this.has("attendance")) return [];
      if (role === "teacher") { const n = new Set(this.myStudentRows().map((s) => s[1])); return rows.filter((r) => n.has(r[1])); }
      return rows;
    }
    if (["invoices", "payments", "receipts", "refunds"].includes(table)) {
      if (this.isFamily) { const n = this.kidNames; return rows.filter((r) => n.has(r[1])); }
      return this.has("finance") ? rows : [];
    }
    if (table === "assessments") {
      if (this.isFamily) { const n = this.kidNames; return rows.filter((r) => n.has(r[0])); }
      if (!this.has("assessments")) return [];
      if (role === "teacher") { const n = new Set(this.myStudentRows().map((s) => s[1])); return rows.filter((r) => n.has(r[0])); }
      return rows;
    }
    return [];
  }

  // ---- writing
  checkWrite(table, row, old, isNew, removing = false) {
    const spec = TABLES[table];
    if (table === "audit") throw new Reject(table, "The audit log is read-only.");
    if (table === "users") {
      if (this.role !== "admin") throw new Reject(table, "Only the admin can manage accounts.");
      return;
    }
    if (table === "leave" && this.isFamily) {
      if (removing || !isNew) throw new Reject(table, "Leave requests can only be created, not changed.");
      if (!this.kidNames.has(row[1])) throw new Reject(table, "You can only request leave for your own child.");
      if (row[4] !== "Pending") throw new Reject(table, "New leave requests must be Pending.");
      return;
    }
    if (this.role !== "admin" && !(spec.perm && this.perms.has(spec.perm))) {
      throw new Reject(table, `You do not have permission to change ${spec.label}s.`);
    }
    if (this.role === "teacher") { // a teacher only touches their own batches / students
      const mb = this.myBatches;
      const names = new Set(this.myStudentRows().map((s) => s[1]));
      const tgt = row || old;
      if (table === "attendance") {
        if (!mb.has(tgt[1]) || (old && !mb.has(old[1]))) throw new Reject(table, "You can only mark attendance for your own batches.");
      } else if (table === "leave") {
        if (!names.has(tgt[1])) throw new Reject(table, "That student is not in your batches.");
      } else if (table === "assessments") {
        if (!names.has(tgt[0])) throw new Reject(table, "That student is not in your batches.");
      } else throw new Reject(table, `You do not have permission to change ${spec.label}s.`);
    }
  }

  validateRow(table, row) {
    const spec = TABLES[table];
    for (const [i, opts] of Object.entries(spec.selects)) {
      if (!opts.includes(row[i])) throw new Reject(table, `Invalid value '${row[i].slice(0, 40)}' for column ${Number(i) + 1}.`);
    }
    if (!row[spec.key[0]].trim()) throw new Reject(table, "The first column cannot be empty.");
    if (table === "attendance") {
      if (!validIso(row[0])) throw new Reject(table, "Invalid attendance date.");
      if (row[0] > todayIso()) throw new Reject(table, "Attendance cannot be marked for a future date.");
      if (!this.rows("batches").some((b) => b[1] === row[1])) throw new Reject(table, "Unknown batch.");
      const st = this.rows("students").find((s) => s[0] === row[2]);
      if (!st) throw new Reject(table, `Unknown student ${row[2]}.`);
      row[3] = st[1];
      if (this.role !== "admin") row[5] = this.u.name;
    }
    if (table === "invoices" && (amt(row[3]) <= 0 || amt(row[4]) > amt(row[3]))) {
      throw new Reject(table, "Invoice amounts are inconsistent (paid is more than the total).");
    }
    if (table === "leave" && !row[3].trim()) throw new Reject(table, "Please give a reason for the leave request.");
  }
}

export function cleanRow(table, raw) {
  const spec = TABLES[table];
  if (!Array.isArray(raw) || raw.length !== spec.ncols) throw new Reject(table, `A row must have exactly ${spec.ncols} columns.`);
  return raw.map((c, i) => {
    const s = c === null || c === undefined ? "" : String(c);
    const isImg = spec.images.includes(i);
    if (s.length > (isImg ? IMG : 4000)) throw new Reject(table, `Column ${i + 1} is too long.`);
    if (isImg && s && !(s.startsWith("data:image/") || s.startsWith("http://") || s.startsWith("https://"))) {
      throw new Reject(table, "Images must be uploaded images or http(s) links.");
    }
    return isImg ? s : s.trim();
  });
}

// ---------------------------------------------------------------- applying changes
const label = (table, isNew) => (isNew ? "Added " : "Edited ") + TABLES[table].label;
const getRec = (table, key) => db.prepare("SELECT id, data FROM records WHERE tbl=? AND key=?").get(table, key);

function applyUsers(ctx, ch, idmap) {
  ctx.checkWrite("users", null, null, false); // admin only
  for (const item of ch.upsert) {
    const row = cleanRow("users", item.row);
    let [uid, name, role, email, status, linked, perms] = row;
    email = email.toLowerCase();
    if (!ROLES.includes(role)) throw new Reject("users", "Unknown role.");
    if (!["Active", "Suspended"].includes(status)) throw new Reject("users", "Unknown status.");
    if (!name || !EMAIL_RE.test(email)) throw new Reject("users", "Every account needs a name and a valid email address.");
    if (perms !== "all") {
      const bad = perms.split(",").map((x) => x.trim()).filter(Boolean).find((p) => !PERMS.includes(p));
      if (bad) throw new Reject("users", `Unknown permission: ${bad}.`);
    }
    if (role === "student" || role === "parent") {
      const ids = linked.split(",").map((x) => x.trim()).filter(Boolean);
      const known = new Set(ctx.rows("students").map((s) => s[0]));
      if (!ids.length || ids.some((i) => !known.has(i))) throw new Reject("users", "Student/parent accounts must be linked to existing student IDs.");
    }
    let existing = getUser(uid);
    if (db.prepare("SELECT 1 FROM users WHERE email=? AND id<>?").get(email, uid)) {
      throw new Reject("users", `The email ${email} is already used by another account.`);
    }
    if (item.new && existing) {
      const newId = nextId("users", uid);
      (idmap.users ??= {})[uid] = newId;
      uid = newId; existing = undefined;
    }
    if (!item.new && !existing) throw new Reject("users", "That account no longer exists.");
    if (existing) {
      db.prepare("UPDATE users SET name=?, role=?, email=?, status=?, linked=?, perms=? WHERE id=?").run(name, role, email, status, linked, perms, uid);
      audit(ctx.u.name, "Edited account", uid);
    } else {
      db.prepare("INSERT INTO users (id,name,role,email,status,linked,perms) VALUES (?,?,?,?,?,?,?)").run(uid, name, role, email, status, linked, perms);
      audit(ctx.u.name, "Added account", uid);
    }
  }
  for (const kv of ch.remove) {
    const uid = kv.join(SEP);
    if (!getUser(uid)) continue;
    if (uid === ctx.u.id) throw new Reject("users", "You cannot delete your own account.");
    db.prepare("DELETE FROM users WHERE id=?").run(uid);
    audit(ctx.u.name, "Deleted account", uid);
  }
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND status='Active' AND pw_hash IS NOT NULL").get();
  if (n < 1) throw new Reject("users", "At least one active admin with a password must remain.");
}

function applyDiff(ctx, table, ch, idmap, counters) {
  if (table === "users") return applyUsers(ctx, ch, idmap);
  const spec = TABLES[table];
  for (const item of ch.upsert) {
    const row = cleanRow(table, item.row);
    ctx.validateRow(table, row);
    let key = keyOf(table, row);
    let existing = getRec(table, key);
    if (item.new && existing) {
      if (spec.idp) {
        row[0] = nextId(table, row[0]);
        (idmap[table] ??= {})[key] = row[0];
        key = keyOf(table, row); existing = undefined;
      } else throw new Reject(table, "An identical entry already exists.");
    }
    if (!item.new && !existing) throw new Reject(table, "That entry was changed or removed by someone else. Reloading.");
    ctx.checkWrite(table, row, existing ? JSON.parse(existing.data) : null, item.new);
    if (existing) {
      db.prepare("UPDATE records SET data=? WHERE id=?").run(JSON.stringify(row), existing.id);
    } else {
      const { lo, hi } = db.prepare("SELECT MIN(pos) AS lo, MAX(pos) AS hi FROM records WHERE tbl=?").get(table);
      const pos = lo !== null ? (item.front ? lo - 1 : hi + 1) : 0;
      db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES (?,?,?,?)").run(table, key, pos, JSON.stringify(row));
    }
    ctx.drop(table);
    counters[table] = (counters[table] || 0) + 1;
    if (table !== "attendance") audit(ctx.u.name, label(table, !existing), key.replaceAll(SEP, " · "));
  }
  for (const kv of ch.remove) {
    const key = kv.map(String).join(SEP);
    const existing = getRec(table, key);
    if (!existing) continue;
    ctx.checkWrite(table, null, JSON.parse(existing.data), false, true);
    db.prepare("DELETE FROM records WHERE id=?").run(existing.id);
    ctx.drop(table);
    counters[table] = (counters[table] || 0) + 1;
    if (table !== "attendance") audit(ctx.u.name, "Deleted " + spec.label, key.replaceAll(SEP, " · "));
  }
}

function applyReplace(ctx, table, ch) {
  const spec = TABLES[table];
  if (ch.rows === null) throw new Reject(table, "Missing rows.");
  ctx.checkWrite(table, null, null, false);
  const cur = Number(getKv(`ver:${table}`, { n: 0 }).n);
  if (ch.version !== null && ch.version !== cur) throw new Reject(table, "This section was changed by someone else. Reloading the latest version.");
  const rows = ch.rows.map((r) => cleanRow(table, r));
  rows.forEach((r) => ctx.validateRow(table, r));
  if (rows.length > 500) throw new Reject(table, "Too many entries.");
  db.prepare("DELETE FROM records WHERE tbl=?").run(table);
  const ins = db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES (?,?,?,?)");
  rows.forEach((r, i) => ins.run(table, String(i), i, JSON.stringify(r)));
  setKv(`ver:${table}`, { n: cur + 1 });
  audit(ctx.u.name, `Updated ${spec.label}s`, `${rows.length} entries`);
}

/** All changes in one request succeed or none do. */
export function applySync(ctx, payload) {
  const idmap = {}, counters = {};
  const run = db.transaction(() => {
    for (const [table, ch] of Object.entries(payload.tables)) {
      if (TABLES[table].mode === "replace") applyReplace(ctx, table, ch);
      else applyDiff(ctx, table, ch, idmap, counters);
      ctx.drop(table);
    }
    if (payload.site !== null) {
      if (!ctx.has("website")) throw new Reject("site", "You do not have permission to edit the website.");
      const site = Object.fromEntries(SITE_KEYS.map((k) => [k, String(payload.site[k] ?? "").slice(0, SITE_IMAGE_KEYS.includes(k) ? IMG : 4000)]));
      setKv("site", site);
      audit(ctx.u.name, "Edited website branding", "");
    }
    if (payload.settings !== null) {
      if (ctx.role !== "admin") throw new Reject("settings", "Only the admin can change settings.");
      const st = Object.fromEntries(SETTINGS_KEYS.map((k) => [k, String(payload.settings[k] ?? "0").replace(/[^\d]/g, "").slice(0, 6) || "0"]));
      setKv("settings", st);
      audit(ctx.u.name, "Edited settings", "");
    }
    if (counters.attendance) audit(ctx.u.name, "Saved attendance", `${counters.attendance} record(s)`);
  });
  try { run(); } catch (e) {
    if (e instanceof Reject) return { ok: false, rejected: [{ table: e.table, reason: e.msg }], idmap: {} };
    throw e;
  }
  return { ok: true, rejected: [], idmap };
}

// ---------------------------------------------------------------- payments
export function payInvoice(ctx, invoiceId, amount, method) {
  if (settings.paymentMode !== "demo") throw new Reject("payments", "Online payment gateway is not configured.");
  if (!ONLINE_METHODS.includes(method)) throw new Reject("payments", "Unsupported payment method.");
  const run = db.transaction(() => {
    const rec = getRec("invoices", invoiceId);
    if (!rec) throw new Reject("invoices", "Invoice not found.");
    const inv = JSON.parse(rec.data);
    if (ctx.isFamily) {
      if (!ctx.kidNames.has(inv[1])) throw new Reject("invoices", "Invoice not found."); // same message: do not reveal other people's invoices
    } else if (!ctx.has("finance")) throw new Reject("invoices", "You do not have permission to take payments.");
    const remaining = amt(inv[3]) - amt(inv[4]);
    if (remaining <= 0) throw new Reject("invoices", "This invoice is already paid.");
    if (amount < 1 || amount > remaining) throw new Reject("invoices", `Amount must be between ₹1 and ${fmtInr(remaining)}.`);
    const paid = amt(inv[4]) + amount;
    inv[4] = fmtInr(paid);
    inv[6] = paid >= amt(inv[3]) ? "Paid" : "Partial";
    db.prepare("UPDATE records SET data=? WHERE id=?").run(JSON.stringify(inv), rec.id);
    const d = todayIso();
    const pid = nextId("payments", "PAY-0000"), rid = nextId("receipts", "RCP-0000");
    const pay = [pid, inv[1], fmtInr(amount), method, "demo-" + crypto.randomBytes(3).toString("hex"), d, "Verified"];
    const rcp = [rid, inv[1], inv[0], fmtInr(amount), d, "Issued"];
    for (const [tbl, row] of [["payments", pay], ["receipts", rcp]]) {
      const { lo } = db.prepare("SELECT MIN(pos) AS lo FROM records WHERE tbl=?").get(tbl);
      db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES (?,?,?,?)").run(tbl, row[0], lo !== null ? lo - 1 : 0, JSON.stringify(row));
    }
    audit(ctx.u.name, `Online payment ${fmtInr(amount)}`, inv[0]);
    return { invoice: inv, payment: pay, receipt: rcp };
  });
  return run();
}

// ---------------------------------------------------------------- reading payloads
const siteOf = () => getKv("site", Object.fromEntries(SITE_KEYS.map((k) => [k, ""])));
const settingsOf = () => getKv("settings", { dueDay: "10", lateFee: "0", lateMins: "10" });

function auditRows(limit = 300) {
  return db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT ?").all(limit).map((a) => {
    const p = localParts(new Date(a.ts));
    return [`${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute}:${p.second} ${String(p.dayPeriod).toLowerCase()}`, a.actor, a.action, a.target];
  });
}

export function publicPayload() {
  const t = {};
  for (const name of PUBLIC_TABLES) {
    const rows = rowsOf(name);
    t[name] = name === "events" ? rows.filter((r) => r[4] !== "Draft") : rows;
  }
  return { site: siteOf(), t };
}

export const versions = () =>
  Object.fromEntries(Object.entries(TABLES).filter(([, s]) => s.mode === "replace").map(([n]) => [n, Number(getKv(`ver:${n}`, { n: 0 }).n)]));

export function bootstrap(ctx) {
  const t = Object.fromEntries(Object.keys(TABLES).map((n) => [n, ctx.visible(n)]));
  if (ctx.role === "admin") t.audit = auditRows();
  const u = ctx.u;
  return {
    user: { id: u.id, name: u.name, role: u.role, email: u.email, linked: u.linked, perms: [...ctx.perms].sort() },
    site: siteOf(), settings: settingsOf(), t, versions: versions(),
  };
}

export { getUser };
