// Nritya Laya academy API + website. Created by index.js (and by the tests).
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { ROOT, settings } from "./config.js";
import { db } from "./db.js";
import { TABLES, schemaJson } from "./schema.js";
import { hashPassword, limiter, makeToken, readToken, validatePassword, verifyPassword } from "./security.js";
import * as svc from "./service.js";
import { EMAIL_RE, HttpError, Reject } from "./service.js";

const bad = (msg) => new HttpError(422, msg);
const str = (v, max, name, { min = 0, optional = false } = {}) => {
  if (v === undefined && optional) return "";
  if (typeof v !== "string" || v.length > max || v.length < min) throw bad(`Invalid ${name}.`);
  return v;
};
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function parseSync(b) {
  if (!isObj(b)) throw bad("Invalid request.");
  const tables = {};
  for (const [t, c] of Object.entries(b.tables ?? {})) {
    if (!(t in TABLES)) throw bad(`Unknown table ${t}.`);
    if (!isObj(c)) throw bad("Invalid request.");
    const upsert = (c.upsert ?? []).map((u) => {
      if (!isObj(u) || !Array.isArray(u.row)) throw bad("Invalid request.");
      return { row: u.row, new: u.new === true, front: u.front === true };
    });
    const remove = c.remove ?? [];
    if (!Array.isArray(upsert) || !Array.isArray(remove) || remove.some((r) => !Array.isArray(r))) throw bad("Invalid request.");
    if (c.rows != null && !Array.isArray(c.rows)) throw bad("Invalid request.");
    if (c.version != null && !Number.isInteger(c.version)) throw bad("Invalid request.");
    tables[t] = { upsert, remove, rows: c.rows ?? null, version: c.version ?? null };
  }
  if (b.site != null && !isObj(b.site)) throw bad("Invalid request.");
  if (b.settings != null && !isObj(b.settings)) throw bad("Invalid request.");
  return { tables, site: b.site ?? null, settings: b.settings ?? null };
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (settings.trustProxy) app.set("trust proxy", true);

  app.use((req, res, next) => {
    res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" });
    if (!settings.prod) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    }
    if (req.path.startsWith("/api/")) {
      res.set("Cache-Control", "no-store");
      res.set("Access-Control-Allow-Origin", settings.corsOrigins.includes("*") ? "*" : (settings.corsOrigins.includes(req.headers.origin) ? req.headers.origin : ""));
      res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: `${settings.maxBodyMb}mb` }));

  const clientIp = (req) => {
    if (settings.trustProxy) { const xf = req.headers["x-forwarded-for"]; if (xf) return String(xf).split(",")[0].trim(); }
    return req.socket.remoteAddress || "unknown";
  };

  // ------------------------------------------------ auth plumbing
  const auth = (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.toLowerCase().startsWith("bearer ")) throw new HttpError(401, "Please sign in.");
    const uid = readToken(h.slice(7).trim());
    const u = uid ? svc.getUser(uid) : null;
    if (!u || u.status !== "Active") throw new HttpError(401, "Your session has expired. Please sign in again.");
    req.user = u;
    req.ctx = new svc.Ctx(u);
    next();
  };

  // ------------------------------------------------ routes
  app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.get("/api/schema", (req, res) => res.json(schemaJson()));
  app.get("/api/public", (req, res) => res.json(svc.publicPayload()));

  app.post("/api/public/enquiry", (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const name = str(b.name, 120, "name", { min: 2 });
    const phone0 = str(b.phone, 30, "phone", { optional: true });
    const email = str(b.email, 254, "email", { optional: true });
    const programme = str(b.programme, 200, "programme", { optional: true });
    const message = str(b.message, 2000, "message", { optional: true });
    const honey = typeof b.website === "string" ? b.website : "";
    const ip = clientIp(req);
    if (honey) return res.status(201).json({ ok: true }); // bot: pretend it worked
    if (limiter.blocked("enq:" + ip, 5, 3600)) throw new HttpError(429, "Too many enquiries from this connection. Please try again later.");
    const phone = phone0.replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 7 && !EMAIL_RE.test(email.trim())) throw bad("Please give a valid phone number or email so the academy can reply.");
    if (email.trim() && !EMAIL_RE.test(email.trim())) throw bad("That email address does not look right.");
    limiter.hit("enq:" + ip, 3600);
    const id = db.transaction(() => {
      const eid = svc.nextId("admissions", "ENQ-001");
      const { lo } = db.prepare("SELECT MIN(pos) AS lo FROM records WHERE tbl='admissions'").get();
      const row = [eid, name.trim(), phone0.trim(), email.trim(), programme.trim(), svc.todayIso(), "Pending", message.trim()];
      db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES ('admissions',?,?,?)").run(eid, lo !== null ? lo - 1 : 0, JSON.stringify(row));
      svc.audit("Visitor", "New admission enquiry", eid);
      return eid;
    })();
    res.status(201).json({ ok: true, id });
  });

  app.post("/api/auth/login", wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const email = str(b.email, 254, "email").trim().toLowerCase();
    const password = str(b.password, 200, "password");
    const key = `login:${clientIp(req)}:${email}`;
    if (limiter.blocked(key, 5, 900)) throw new HttpError(429, "Too many failed attempts. Please wait 15 minutes and try again.");
    const u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    const ok = await verifyPassword(password, u ? u.pw_hash : null);
    if (!(u && ok)) { limiter.hit(key, 900); throw new HttpError(401, "Invalid email or password."); }
    if (u.status !== "Active") throw new HttpError(403, "This account is suspended. Please contact the academy.");
    limiter.reset(key);
    db.prepare("UPDATE users SET last_login=? WHERE id=?").run(new Date().toISOString(), u.id);
    res.json({ token: makeToken(u.id), user: { id: u.id, name: u.name, role: u.role } });
  }));

  app.get("/api/auth/me", auth, (req, res) => res.json({ id: req.user.id, name: req.user.name, role: req.user.role, email: req.user.email }));

  app.post("/api/auth/password", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const cur = str(b.current, 200, "current password"), nw = str(b.new, 200, "new password");
    if (!(await verifyPassword(cur, req.user.pw_hash))) throw new HttpError(400, "Your current password is not correct.");
    const err = validatePassword(nw);
    if (err) throw bad(err);
    const hash = await hashPassword(nw);
    db.prepare("UPDATE users SET pw_hash=? WHERE id=?").run(hash, req.user.id);
    svc.audit(req.user.name, "Changed own password", req.user.id);
    res.json({ ok: true });
  }));

  app.post("/api/users/:uid/password", auth, wrap(async (req, res) => {
    if (req.user.role !== "admin") throw new HttpError(403, "Only the admin can set passwords.");
    const target = svc.getUser(req.params.uid);
    if (!target) throw new HttpError(404, "Account not found.");
    const pw = str(req.body?.password, 200, "password");
    const err = validatePassword(pw);
    if (err) throw bad(err);
    db.prepare("UPDATE users SET pw_hash=? WHERE id=?").run(await hashPassword(pw), target.id);
    svc.audit(req.user.name, "Set password for account", target.id);
    res.json({ ok: true });
  }));

  app.get("/api/bootstrap", auth, (req, res) => res.json(svc.bootstrap(req.ctx)));

  app.post("/api/sync", auth, (req, res) => {
    const payload = parseSync(req.body);
    const out = svc.applySync(req.ctx, payload);
    if (out.ok) out.versions = svc.versions();
    res.status(out.ok ? 200 : 409).json(out);
  });

  app.post("/api/payments/pay", auth, (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const invoice = str(b.invoice, 100, "invoice");
    const method = str(b.method, 40, "method");
    if (!Number.isInteger(b.amount) || b.amount < 1 || b.amount > 10_000_000) throw bad("Invalid amount.");
    try { res.json(svc.payInvoice(req.ctx, invoice, b.amount, method)); }
    catch (e) { if (e instanceof Reject) throw new HttpError(400, e.msg); throw e; }
  });

  app.use("/api", (req, res) => res.status(404).json({ detail: "Not found." }));

  // ------------------------------------------------ static assets & website
  app.use(express.static(path.join(ROOT, "public"), {
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res) => {
      if (!settings.prod) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
    }
  }));
  app.get("/", (req, res) => {
    if (fs.existsSync(settings.frontendFile)) {
      if (!settings.prod) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
      return res.type("html").send(fs.readFileSync(settings.frontendFile));
    }
    res.status(404).send(`Website file not found at ${settings.frontendFile}`);
  });

  // ------------------------------------------------ errors
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ detail: err.detail });
    if (err.type === "entity.too.large") return res.status(413).json({ detail: "Request too large." });
    if (err.type === "entity.parse.failed") return res.status(422).json({ detail: "Invalid request." });
    console.error(err);
    res.status(500).json({ detail: "Something went wrong on the server." });
  });
  return app;
}
