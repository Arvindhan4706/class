import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nritya-"));
Object.assign(process.env, { DATA_DIR: tmp, SEED_DEMO: "1", SECRET_KEY: "test-secret", DEMO_PASSWORD: "Demo@12345" });

const { createApp } = await import("../server/app.js");
const { seedIfEmpty } = await import("../server/seed.js");
const { limiter } = await import("../server/security.js");
const { todayIso, fmtInr } = await import("../server/service.js");

const PW = "Demo@12345";
let server, base;
before(async () => {
  await seedIfEmpty();
  await new Promise((r) => { server = createApp().listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => limiter.clear());

async function call(method, url, body, headers = {}) {
  const r = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}
const get = (u, h) => call("GET", u, undefined, h);
const post = (u, b, h) => call("POST", u, b, h);
const login = (email, pw = PW) => post("/api/auth/login", { email, password: pw });
const tokens = {};
async function hdr(email) {
  const r = await login(email);
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return { Authorization: "Bearer " + r.json.token };
}
const boot = async (email) => (await get("/api/bootstrap", await hdr(email))).json;
const sync = (h, tables = {}, extra = {}) => post("/api/sync", { tables, ...extra }, h);
const up = (row, isNew = true, front = false) => ({ row, new: isNew, front });

// ------------------------------------------------------------ auth
test("wrong password and unknown user look identical", async () => {
  const a = await login("owner@example.com", "wrong-password"), b = await login("nobody@example.com", "wrong-password");
  assert.equal(a.status, 401); assert.equal(b.status, 401); assert.deepEqual(a.json, b.json);
});
test("lockout after repeated failures", async () => {
  for (let i = 0; i < 5; i++) assert.equal((await login("guru1@example.com", "bad-pass-123")).status, 401);
  assert.equal((await login("guru1@example.com", PW)).status, 429);
});
test("requires a token", async () => {
  assert.equal((await get("/api/bootstrap")).status, 401);
  assert.equal((await get("/api/bootstrap", { Authorization: "Bearer garbage" })).status, 401);
  assert.equal((await post("/api/sync", { tables: {} })).status, 401);
});
test("passwords never leave the server", async () => {
  const s = JSON.stringify(await boot("owner@example.com"));
  assert.ok(!s.includes("pw_hash") && !s.includes("$2a$") && !s.includes("$2b$"));
});

// ------------------------------------------------------------ reading rules
test("admin sees everything", async () => {
  const b = await boot("owner@example.com");
  assert.equal(b.t.students.length, 10); assert.equal(b.t.users.length, 9); assert.equal(b.t.invoices.length, 10);
  assert.ok(b.t.attendance.length); assert.equal(b.user.role, "admin");
});
test("student sees only own data", async () => {
  const b = await boot("studenta@example.com");
  assert.deepEqual(b.t.students.map((s) => s[0]), ["STU001"]);
  assert.ok(b.t.attendance.every((r) => r[2] === "STU001"));
  assert.ok(b.t.invoices.every((r) => r[1] === "Student A"));
  assert.deepEqual(b.t.users, [["U-006", "Student A", "student", "studenta@example.com", "Active", "STU001", ""]]);
  assert.deepEqual([b.t.admissions, b.t.audit, b.t.guardians], [[], [], []]);
  assert.ok(b.t.payments.length && b.t.payments.every((r) => r[1] === "Student A"));
});
test("parent sees only linked child", async () => {
  const b = await boot("guardianb@example.com");
  assert.deepEqual(b.t.students.map((s) => s[0]), ["STU002"]);
  assert.ok(b.t.invoices.every((r) => r[1] === "Student B"));
});
test("teacher sees only own batches", async () => {
  const b = await boot("guru2@example.com");
  assert.ok(b.t.attendance.every((r) => r[1] === "Intermediate"));
  assert.ok(b.t.students.every((s) => s[2] === "Intermediate"));
  assert.deepEqual(b.t.invoices, []);
});
test("accounts sees finance, not attendance", async () => {
  const b = await boot("accounts@example.com");
  assert.equal(b.t.invoices.length, 10); assert.deepEqual(b.t.attendance, []);
});
test("draft events are hidden from the public", async () => {
  const pub = (await get("/api/public")).json;
  assert.ok(pub.t.events.every((e) => e[4] !== "Draft")); assert.ok(pub.site.name);
});

// ------------------------------------------------------------ writing rules
test("a student cannot write anything privileged", async () => {
  const h = await hdr("studenta@example.com");
  for (const [t, row] of [["students", ["STU900", "X", "Intermediate", "Beginner", "G", "₹1", "Active"]], ["invoices", ["INV-X-1", "Student A", "Nov", "₹100", "₹100", "10 Nov", "Paid"]]]) {
    const r = await sync(h, { [t]: { upsert: [up(row)] } });
    assert.equal(r.status, 409, t); assert.equal(r.json.ok, false);
  }
  assert.equal((await sync(h, {}, { site: { name: "Hacked" } })).status, 409);
  assert.equal((await sync(h, { users: { upsert: [up(["U-006", "Student A", "admin", "studenta@example.com", "Active", "STU001", "all"], false)] } })).status, 409);
  const o = await boot("owner@example.com");
  assert.notEqual(o.site.name, "Hacked");
  assert.equal(o.t.users.find((u) => u[0] === "U-006")[2], "student");
});
test("parent leave request rules", async () => {
  const h = await hdr("guardiana@example.com");
  assert.equal((await sync(h, { leave: { upsert: [up(["LV-900", "Student A", "10 Nov", "Family function", "Pending"], true, true)] } })).status, 200);
  assert.equal((await sync(h, { leave: { upsert: [up(["LV-901", "Student B", "10 Nov", "x", "Pending"])] } })).status, 409);
  assert.equal((await sync(h, { leave: { upsert: [up(["LV-900", "Student A", "10 Nov", "Family function", "Approved"], false)] } })).status, 409);
  const t = await hdr("guru1@example.com");
  assert.equal((await sync(t, { leave: { upsert: [up(["LV-900", "Student A", "10 Nov", "Family function", "Approved"], false)] } })).status, 200);
});
test("ID collision is reassigned, not overwritten", async () => {
  const h = await hdr("owner@example.com");
  const before = (await boot("owner@example.com")).t.students;
  const r = await sync(h, { students: { upsert: [up(["STU001", "Imposter", "Intermediate", "Beginner", "G", "₹1", "Active"])] } });
  assert.equal(r.status, 200); assert.notEqual(r.json.idmap.students.STU001, "STU001");
  const after = (await boot("owner@example.com")).t.students;
  assert.equal(after.length, before.length + 1); assert.notEqual(after.find((s) => s[0] === "STU001")[1], "Imposter");
});
test("select values and row shape are validated", async () => {
  const h = await hdr("owner@example.com");
  assert.equal((await sync(h, { students: { upsert: [up(["STU950", "N", "Intermediate", "Beginner", "G", "₹1", "Whatever"])] } })).status, 409);
  assert.equal((await sync(h, { students: { upsert: [up(["short"])] } })).status, 409);
  assert.equal((await sync(h, { nope: {} })).status, 422);
});
test("edit and delete a student, with audit trail", async () => {
  const h = await hdr("owner@example.com");
  const row = ["STU777", "Temp Student", "Intermediate", "Beginner", "G", "₹1,000", "Active"];
  assert.equal((await sync(h, { students: { upsert: [up(row)] } })).status, 200);
  row[1] = "Renamed Student";
  assert.equal((await sync(h, { students: { upsert: [up(row, false)] } })).status, 200);
  assert.equal((await sync(h, { students: { remove: [["STU777"]] } })).status, 200);
  const b = await boot("owner@example.com");
  assert.ok(!b.t.students.some((s) => s[0] === "STU777"));
  const acts = b.t.audit.filter((a) => a[3] === "STU777").map((a) => a[2]);
  for (const a of ["Added student", "Edited student", "Deleted student"]) assert.ok(acts.includes(a), a);
  assert.equal(b.t.audit[0][1], "Academy Owner");
  assert.match(b.t.audit[0][0], /^\d\d\/\d\d\/\d{4}, \d\d:\d\d:\d\d (am|pm)$/);
});

// ------------------------------------------------------------ attendance
const att = (d, batch, sid, status, by = "x") => up([d, batch, sid, "", status, by]);
test("teacher can mark own batch only", async () => {
  const d = todayIso();
  const h = await hdr("guru2@example.com");
  const ib = (await boot("guru2@example.com")).t.students[0];
  assert.equal((await sync(h, { attendance: { upsert: [att(d, "Intermediate", ib[0], "Present", "someone else")] } })).status, 200);
  const mine = (await boot("guru2@example.com")).t.attendance.find((a) => a[0] === d && a[2] === ib[0]);
  assert.equal(mine[5], "Guru 2"); assert.equal(mine[3], ib[1]);
  assert.equal((await sync(h, { attendance: { upsert: [att(d, "Advanced", "STU003", "Present")] } })).status, 409);
  const sb = await boot(ib[0] === "STU001" ? "studenta@example.com" : "studentb@example.com");
  assert.ok(sb.t.attendance.some((a) => a[0] === d));
});
test("attendance validation", async () => {
  const h = await hdr("owner@example.com");
  for (const bad of [att("2099-01-01", "Intermediate", "STU002", "Present"), att("not-a-date", "Intermediate", "STU002", "Present"),
    att(todayIso(), "Intermediate", "NOPE", "Present"), att(todayIso(), "Intermediate", "STU002", "Maybe"), att(todayIso(), "No Such Batch", "STU002", "Present")]) {
    assert.equal((await sync(h, { attendance: { upsert: [bad] } })).status, 409);
  }
});
test("a failed sync is atomic", async () => {
  const h = await hdr("owner@example.com");
  const r = await sync(h, { students: { upsert: [up(["STU801", "Atomic Test", "Intermediate", "Beginner", "G", "₹1", "Active"]), up(["STU802", "Bad", "Intermediate", "Beginner", "G", "₹1", "Nope"])] } });
  assert.equal(r.status, 409);
  assert.ok(!(await boot("owner@example.com")).t.students.some((s) => s[0] === "STU801"));
});

// ------------------------------------------------------------ payments
const pay = (h, invoice, amount, method) => post("/api/payments/pay", { invoice, amount, method }, h);
test("pay invoice flow and limits", async () => {
  const h = await hdr("studentb@example.com");
  const inv = (await boot("studentb@example.com")).t.invoices.find((i) => i[6] === "Pending");
  assert.equal((await pay(h, inv[0], 99999, "UPI (online)")).status, 400);
  assert.equal((await pay(h, inv[0], 500, "Cash")).status, 400);
  const r = await pay(h, inv[0], 500, "UPI (online)");
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const j = r.json;
  assert.equal(j.invoice[4], "₹500"); assert.equal(j.invoice[6], "Partial"); assert.equal(j.payment[6], "Verified"); assert.equal(j.receipt[2], inv[0]);
  const total = parseInt(inv[3].replace(/[₹,]/g, ""), 10);
  const r2 = await pay(h, inv[0], total - 500, "Card (online)");
  assert.equal(r2.status, 200); assert.equal(r2.json.invoice[6], "Paid");
  assert.equal((await pay(h, inv[0], 1, "UPI (online)")).status, 400);
  const b = await boot("studentb@example.com");
  assert.ok(b.t.payments.some((p) => p[0] === j.payment[0])); assert.ok(b.t.receipts.some((x) => x[0] === j.receipt[0]));
});
test("cannot pay someone else's invoice", async () => {
  const h = await hdr("studenta@example.com");
  const other = (await boot("owner@example.com")).t.invoices.find((i) => i[1] === "Student C");
  const r = await pay(h, other[0], 100, "UPI (online)");
  assert.equal(r.status, 400); assert.equal(r.json.detail, "Invoice not found.");
});
test("INR formatting", () => {
  assert.equal(fmtInr(500), "₹500"); assert.equal(fmtInr(1500), "₹1,500"); assert.equal(fmtInr(123456), "₹1,23,456"); assert.equal(fmtInr(1234567), "₹12,34,567");
});

// ------------------------------------------------------------ accounts / admin
test("admin sets a password and the user can log in", async () => {
  const h = await hdr("owner@example.com");
  assert.equal((await sync(h, { users: { upsert: [up(["U-050", "New Teacher", "teacher", "new.teacher@example.com", "Active", "Guru 1", "attendance"])] } })).status, 200);
  assert.equal((await login("new.teacher@example.com", PW)).status, 401);
  assert.equal((await post("/api/users/U-050/password", { password: "short" }, h)).status, 422);
  assert.equal((await post("/api/users/U-050/password", { password: "Brand-new-pass1" }, h)).status, 200);
  assert.equal((await login("new.teacher@example.com", "Brand-new-pass1")).status, 200);
  const t = await hdr("guru1@example.com");
  assert.equal((await post("/api/users/U-050/password", { password: "Another-pass-1" }, t)).status, 403);
});
test("account rules", async () => {
  const h = await hdr("owner@example.com");
  const u = (r) => sync(h, { users: { upsert: [up(r)] } });
  assert.equal((await u(["U-060", "Dup", "teacher", "guru1@example.com", "Active", "Guru 1", "attendance"])).status, 409);
  assert.equal((await u(["U-061", "Kid", "student", "kid@example.com", "Active", "STU999", ""])).status, 409);
  assert.equal((await u(["U-062", "T", "teacher", "t62@example.com", "Active", "Guru 1", "root"])).status, 409);
  assert.equal((await sync(h, { users: { remove: [["U-001"]] } })).status, 409);
  assert.equal((await sync(h, { users: { upsert: [up(["U-001", "Academy Owner", "admin", "owner@example.com", "Suspended", "", "all"], false)] } })).status, 409);
});
test("a suspended user loses access immediately", async () => {
  const h = await hdr("owner@example.com"), victim = await hdr("guru3@example.com");
  assert.equal((await sync(h, { users: { upsert: [up(["U-004", "Guru 3", "teacher", "guru3@example.com", "Suspended", "Guru 3", "attendance,assessments"], false)] } })).status, 200);
  assert.equal((await get("/api/bootstrap", victim)).status, 401);
  assert.equal((await login("guru3@example.com")).status, 403);
});
test("change own password", async () => {
  const h = await hdr("accounts@example.com");
  assert.equal((await post("/api/auth/password", { current: "wrong", new: "Longer-pass-12" }, h)).status, 400);
  assert.equal((await post("/api/auth/password", { current: PW, new: "Longer-pass-12" }, h)).status, 200);
  assert.equal((await login("accounts@example.com", PW)).status, 401);
  assert.equal((await login("accounts@example.com", "Longer-pass-12")).status, 200);
});

// ------------------------------------------------------------ website content
test("website content: replace with version check", async () => {
  const h = await hdr("owner@example.com");
  const b = await boot("owner@example.com");
  const ver = b.versions.gurus, rows = [...b.t.gurus, ["New Guru", "Teacher", "Bio", ""]];
  const r = await sync(h, { gurus: { rows, version: ver } });
  assert.equal(r.status, 200); assert.equal(r.json.versions.gurus, ver + 1);
  assert.equal((await sync(h, { gurus: { rows: rows.slice(0, 1), version: ver } })).status, 409);
  assert.equal((await get("/api/public")).json.t.gurus.length, rows.length);
  const t = await hdr("guru1@example.com");
  assert.equal((await sync(t, { gurus: { rows: [], version: ver + 1 } })).status, 409);
  assert.equal((await sync(h, { gurus: { rows: [["G", "T", "B", "javascript:alert(1)"]], version: ver + 1 } })).status, 409);
});
test("site branding and fee settings", async () => {
  const h = await hdr("owner@example.com");
  const site = { ...(await boot("owner@example.com")).site, name: "Nritya Laya Academy" };
  assert.equal((await sync(h, {}, { site })).status, 200);
  assert.equal((await get("/api/public")).json.site.name, "Nritya Laya Academy");
  assert.equal((await sync(h, {}, { settings: { dueDay: "15", lateFee: "50", lateMins: "10" } })).status, 200);
  assert.equal((await boot("owner@example.com")).settings.dueDay, "15");
  const t = await hdr("guru1@example.com");
  assert.equal((await sync(t, {}, { settings: { dueDay: "1", lateFee: "0", lateMins: "1" } })).status, 409);
});

// ------------------------------------------------------------ public enquiry
test("public enquiry and rate limit", async () => {
  const body = { name: "Visitor One", phone: "+91 98765 43210", email: "", programme: "Foundations", message: "Hello" };
  const r = await post("/api/public/enquiry", body);
  assert.equal(r.status, 201); assert.ok(r.json.id.startsWith("ENQ-"));
  assert.ok((await boot("owner@example.com")).t.admissions.some((a) => a[0] === r.json.id && a[6] === "Pending"));
  assert.equal((await post("/api/public/enquiry", { name: "A", phone: "1" })).status, 422);
  assert.equal((await post("/api/public/enquiry", { name: "No Contact" })).status, 422);
  assert.deepEqual((await post("/api/public/enquiry", { ...body, website: "http://spam" })).json, { ok: true });
  limiter.clear();
  for (let i = 0; i < 5; i++) assert.equal((await post("/api/public/enquiry", body)).status, 201);
  assert.equal((await post("/api/public/enquiry", body)).status, 429);
});

test("website page, health and schema", async () => {
  assert.equal((await get("/api/health")).json.ok, true);
  assert.deepEqual((await get("/api/schema")).json.attendance.key, [0, 1, 2]);
  const r = await fetch(base + "/");
  assert.equal(r.status, 200); assert.match(await r.text(), /Nritya Laya/);
});
