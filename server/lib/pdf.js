// server/lib/pdf.js
// PDF receipt generation using pdfkit — Phase 2
import path from "node:path";
import fs from "node:fs";
import { ROOT } from "../config.js";

const RECEIPTS_DIR = path.join(ROOT, "data", "receipts");

/**
 * Generate a PDF payment receipt and save it to data/receipts/.
 * Returns the absolute file path.
 *
 * @param {object} opts
 * @param {string} opts.receiptNo   e.g. "RCP-001"
 * @param {string} opts.studentName
 * @param {string} opts.studentId
 * @param {string} opts.invoiceNo
 * @param {number} opts.amountPaise  amount in paise (divide by 100 for INR)
 * @param {string} opts.paymentId   Razorpay payment ID
 * @param {string} opts.paidOn      ISO date string
 * @param {string} opts.description e.g. "Monthly fee — 2026-11"
 */
export async function generateReceipt(opts) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  const filename = `receipt-${opts.receiptNo.replace(/[^A-Za-z0-9-]/g, "_")}.pdf`;
  const filePath = path.join(RECEIPTS_DIR, filename);

  const { default: PDFDocument } = await import("pdfkit");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const amountINR = (opts.amountPaise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    const paidOn = opts.paidOn ? new Date(opts.paidOn).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—";

    // ── Header
    doc
      .fontSize(22).fillColor("#7C3AED").text("Nritya Laya Academy", { align: "center" })
      .fontSize(10).fillColor("#6B7280").text("Bharatanatyam & Performing Arts", { align: "center" })
      .moveDown(0.3)
      .fillColor("#7C3AED").moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      .moveDown(0.5);

    // ── Receipt title
    doc
      .fontSize(16).fillColor("#111827").text("PAYMENT RECEIPT", { align: "center" })
      .moveDown(1);

    // ── Details table
    const left = 60, labelW = 160;
    function row(label, value) {
      doc.fontSize(11).fillColor("#6B7280").text(label, left, doc.y, { width: labelW, continued: true })
         .fillColor("#111827").text(value);
    }

    row("Receipt No:", opts.receiptNo);
    row("Invoice No:", opts.invoiceNo || "—");
    row("Student Name:", opts.studentName);
    row("Student ID:", opts.studentId);
    row("Description:", opts.description || "Academy Fee");
    row("Payment ID:", opts.paymentId || "—");
    row("Paid On:", paidOn);

    doc.moveDown(0.5)
       .fillColor("#7C3AED").moveTo(50, doc.y).lineTo(545, doc.y).stroke()
       .moveDown(0.5);

    // ── Amount
    doc.fontSize(16).fillColor("#111827").text(`Amount Paid: ${amountINR}`, { align: "right" })
       .moveDown(2);

    // ── Footer
    doc
      .fontSize(9).fillColor("#9CA3AF")
      .text("This is a computer-generated receipt and does not require a signature.", { align: "center" })
      .text("For queries contact: admin@nrityalaya.in | +91 98765 43210", { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

/** Stream a saved receipt PDF to an Express response. */
export function streamReceipt(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ detail: "Receipt not found." });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  fs.createReadStream(filePath).pipe(res);
}
