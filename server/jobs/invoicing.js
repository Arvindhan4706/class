// server/jobs/invoicing.js
// Monthly auto-invoice generation cron — Phase 1
// Fires on the 1st of each month at 06:00 IST, creates fee invoices for all active students.
import cron from "node-cron";
import { db } from "../db.js";
import * as svc from "../service.js";

/**
 * Generate monthly fee invoices for all active students who don't already
 * have an invoice for the current month.
 * Returns { created: number, skipped: number }.
 */
export function generateMonthlyInvoices() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthLabel = `${year}-${month}`; // e.g. "2026-11"
  const dueDate = `${year}-${month}-15`; // due on 15th of the month

  // Read fee amount from academy settings (kv table)
  const feeRow = db.prepare("SELECT value FROM kv WHERE key='monthlyFeeINR'").get();
  const feeAmount = feeRow ? Number(feeRow.value) : 0;
  if (!feeAmount || feeAmount < 1) {
    console.log("[invoicing] Monthly fee not set — skipping auto-invoice.");
    return { created: 0, skipped: 0, reason: "fee_not_set" };
  }

  const students = db.prepare("SELECT id, name FROM users WHERE role='student' AND status='Active'").all();
  let created = 0;
  let skipped = 0;

  for (const student of students) {
    // Check if invoice already exists for this student+month
    const existingKey = `INV-${student.id}-${monthLabel}`;
    const exists = db.prepare("SELECT 1 FROM records WHERE tbl='invoices' AND key=?").get(existingKey);
    if (exists) { skipped++; continue; }

    db.transaction(() => {
      // Find the next invoice id
      const id = svc.nextId("invoices", "INV-001");
      const description = `Monthly fee — ${monthLabel}`;
      // row format: [id, studentId, description, amount, dueDate, status, createdAt]
      const row = [id, student.id, description, feeAmount * 100, dueDate, "Pending", now.toISOString()];
      const { lo } = db.prepare("SELECT MIN(pos) AS lo FROM records WHERE tbl='invoices'").get();
      db.prepare("INSERT INTO records (tbl,key,pos,data) VALUES ('invoices',?,?,?)").run(
        id, lo !== null ? lo - 1 : 0, JSON.stringify(row)
      );
      svc.audit("System", `Auto-generated monthly invoice for ${student.name}`, id);
    })();

    // Queue in-app notification
    try {
      db.prepare(
        `INSERT INTO notification_inbox (user_id, type, title, body, ref_id)
         VALUES (?,?,?,?,?)`
      ).run(
        student.id,
        "invoice",
        "New Invoice",
        `Your monthly fee invoice for ${monthLabel} of ₹${feeAmount.toLocaleString("en-IN")} is due by ${dueDate}.`,
        existingKey
      );
    } catch (_) { /* non-fatal */ }

    created++;
  }

  console.log(`[invoicing] Monthly invoices: created=${created}, skipped=${skipped}`);
  return { created, skipped, month: monthLabel, feeAmount };
}

/** Register the monthly invoice cron job. Call once at startup. */
export function setupInvoicingJob() {
  // "30 0 1 * *" = 00:30 UTC on the 1st = 06:00 IST on the 1st
  cron.schedule("30 0 1 * *", () => {
    console.log("[invoicing] Running monthly auto-invoice generation...");
    try {
      const result = generateMonthlyInvoices();
      console.log("[invoicing] Done:", result);
    } catch (err) {
      console.error("[invoicing] Error:", err.message);
      svc.audit("System", "Auto-invoicing FAILED", err.message);
    }
  }, { timezone: "UTC" });
  console.log("[invoicing] Monthly invoicing job scheduled (06:00 IST, 1st of month).");
}
