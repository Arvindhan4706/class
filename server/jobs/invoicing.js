// server/jobs/invoicing.js — monthly automatic invoice generation
import { db } from "../db.js";
import * as svc from "../service.js";
import { notify, CHANNELS } from "../lib/notify.js";

export function setupInvoicingJob() {
  import("node-cron").then(({ default: cron }) => {
    // Run at 06:00 IST on the 1st of every month
    cron.schedule("0 6 1 * *", () => generateMonthlyInvoices(), { timezone: "Asia/Kolkata" });
    console.log("[invoicing] Monthly invoicing job scheduled.");
  }).catch(() => {
    console.warn("[invoicing] node-cron not available — skipping invoicing job setup.");
  });
}

export function generateMonthlyInvoices() {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const kv = db.prepare("SELECT v FROM kv WHERE k='settings'").get();
  if (!kv) return;
  let feeSettings;
  try { feeSettings = JSON.parse(kv.v); } catch { return; }

  const monthlyFee = feeSettings?.monthlyFee || feeSettings?.fee || 0;
  if (!monthlyFee) {
    console.warn("[invoicing] No monthly fee configured in settings — skipping invoice generation.");
    return;
  }

  const students = db.prepare("SELECT id, name, email FROM users WHERE role='student' AND status='Active'").all();
  let created = 0;

  for (const student of students) {
    // Check if invoice already exists for this month
    const existing = db.prepare(
      "SELECT key FROM records WHERE tbl='invoices' AND key LIKE ?"
    ).get(`INV-%`);
    // Simple check by looking for this student+month in invoice data
    const invoiceKey = `INV-${student.id.slice(0, 8)}-${month.replace("-", "")}`;
    const dup = db.prepare("SELECT 1 FROM records WHERE tbl='invoices' AND key=?").get(invoiceKey);
    if (dup) continue;

    try {
      db.transaction(() => {
        const row = [invoiceKey, student.id, student.name, `${month}-01`, monthlyFee, 0, monthlyFee, "Unpaid", "Monthly tuition fee", ""];
        const { lo } = db.prepare("SELECT MIN(pos) AS lo FROM records WHERE tbl='invoices'").get();
        db.prepare("INSERT OR IGNORE INTO records (tbl,key,pos,data) VALUES ('invoices',?,?,?)").run(
          invoiceKey, lo !== null ? lo - 1 : 0, JSON.stringify(row)
        );
      })();
      notify(student.id, "fee_due", { month, amount: monthlyFee, invoiceKey }, [CHANNELS.INAPP]);
      created++;
    } catch (e) {
      console.error(`[invoicing] Failed for student ${student.id}:`, e.message);
    }
  }

  console.log(`[invoicing] Generated ${created} invoices for ${month}.`);
  return created;
}
