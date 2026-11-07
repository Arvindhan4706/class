// First-run data. Real deployments start with one admin and empty tables; sample data is loaded in dev mode.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { settings } from "./config.js";
import { SITE_KEYS, TABLES } from "./schema.js";
import { hashPassword } from "./security.js";
import { setKv } from "./service.js";

const DEMO = path.join(path.dirname(fileURLToPath(import.meta.url)), "demo_seed.json");

export async function seedIfEmpty() {
  if (db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0) return;
  const demo = fs.existsSync(DEMO) ? JSON.parse(fs.readFileSync(DEMO, "utf8")) : { site: {}, settings: {}, t: {} };
  const hash = await hashPassword(settings.demoPassword);
  const adminHash = settings.adminPassword ? await hashPassword(settings.adminPassword) : null;
  const generated = settings.seedDemo || settings.adminPassword ? null : crypto.randomBytes(9).toString("base64url");
  const generatedHash = generated ? await hashPassword(generated) : null;

  db.transaction(() => {
    setKv("site", Object.fromEntries(SITE_KEYS.map((k) => [k, demo.site?.[k] ?? ""])));
    setKv("settings", demo.settings && Object.keys(demo.settings).length ? demo.settings : { dueDay: "10", lateFee: "0", lateMins: "10" });
    if (settings.seedDemo) {
      const ins = db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES (?,?,?,?)");
      for (const [name, rows] of Object.entries(demo.t)) {
        const spec = TABLES[name];
        if (!spec || name === "users" || name === "audit") continue;
        rows.forEach((r, i) => {
          const key = spec.mode === "diff" ? spec.key.map((j) => String(r[j])).join("\x1f") : String(i);
          ins.run(name, key, i, JSON.stringify(r.map(String)));
        });
        if (spec.mode === "replace") setKv(`ver:${name}`, { n: 1 });
      }
      const u = db.prepare("INSERT INTO users (id,name,role,email,status,linked,perms,pw_hash) VALUES (?,?,?,?,?,?,?,?)");
      for (const r of demo.t.users) {
        const owner = r[2] === "admin" && settings.adminPassword;
        u.run(r[0], r[1], r[2], (owner ? settings.adminEmail : r[3]).toLowerCase(), r[4], r[5], r[6], owner ? adminHash : hash);
      }
    } else {
      db.prepare("INSERT INTO users (id,name,role,email,status,linked,perms,pw_hash) VALUES ('U-001','Academy Owner','admin',?,'Active','','all',?)")
        .run(settings.adminEmail.toLowerCase(), adminHash || generatedHash);
    }
  })();

  if (settings.seedDemo) console.log(`[seed] Sample data loaded. Every sample account uses the password: ${settings.demoPassword}  (see README for the email list)`);
  else if (generated) console.log(`[seed] Admin account created: ${settings.adminEmail}  password: ${generated}   <- shown once, save it now`);
  else console.log(`[seed] Admin account created: ${settings.adminEmail}`);
}
