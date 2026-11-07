// server/routes/payments.js
// Razorpay payment gateway routes — Phase 1
import crypto from "node:crypto";
import { db } from "../db.js";
import { settings } from "../config.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Lazily-loaded Razorpay SDK — only needed in production. */
let _razorpay = null;
async function getRazorpay() {
  if (_razorpay) return _razorpay;
  if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
    throw new HttpError(503, "Payment gateway is not configured. Please contact the academy.");
  }
  const { default: Razorpay } = await import("razorpay");
  _razorpay = new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret });
  return _razorpay;
}

/** Verify Razorpay HMAC signature. */
function verifySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", settings.razorpayKeySecret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export function paymentRoutes(app, auth, rawBody) {
  // ── POST /api/payments/create-order
  // Creates a Razorpay order for an invoice; returns orderId + key for the frontend checkout widget.
  app.post("/api/payments/create-order", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw new HttpError(422, "Invalid request.");

    const invoiceKey = typeof b.invoice === "string" ? b.invoice.trim() : "";
    if (!invoiceKey) throw new HttpError(422, "Missing invoice.");
    if (!Number.isInteger(b.amount) || b.amount < 1 || b.amount > 10_000_000) {
      throw new HttpError(422, "Invalid amount.");
    }

    // Load invoice and verify ownership
    const invoiceRow = db.prepare("SELECT data FROM records WHERE tbl='invoices' AND key=?").get(invoiceKey);
    if (!invoiceRow) throw new HttpError(404, "Invoice not found.");
    const invoiceData = JSON.parse(invoiceRow.data);
    // invoiceData[1] is student_id (from schema: [id, studentId, ...])
    const studentId = invoiceData[1];
    if (req.user.role === "student" && req.user.id !== studentId) {
      throw new HttpError(403, "You can only pay your own invoice.");
    }

    // Check not already paid
    const existingPaid = db.prepare(
      "SELECT id FROM payment_orders WHERE invoice_key=? AND status='paid'"
    ).get(invoiceKey);
    if (existingPaid) throw new HttpError(409, "This invoice has already been paid.");

    const rz = await getRazorpay();
    const order = await rz.orders.create({
      amount: b.amount, // in paise
      currency: "INR",
      receipt: invoiceKey,
      notes: { invoice: invoiceKey, student: studentId },
    });

    // Persist the order record
    const internalId = `PO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    db.prepare(
      `INSERT INTO payment_orders (id, invoice_key, student_id, amount, razorpay_order_id, status)
       VALUES (?,?,?,?,?,'created')`
    ).run(internalId, invoiceKey, studentId, b.amount, order.id);

    svc.audit(req.user.name, "Created payment order", invoiceKey);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: settings.razorpayKeyId,
    });
  }));

  // ── POST /api/payments/verify
  // Called by frontend after successful Razorpay checkout. Verifies HMAC and marks invoice paid.
  app.post("/api/payments/verify", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw new HttpError(422, "Invalid request.");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpError(422, "Missing payment verification fields.");
    }
    if (!settings.razorpayKeySecret) throw new HttpError(503, "Payment gateway not configured.");

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      svc.audit("System", "Payment signature verification FAILED", razorpay_order_id);
      throw new HttpError(400, "Payment verification failed. Please contact the academy.");
    }

    const orderRow = db.prepare(
      "SELECT * FROM payment_orders WHERE razorpay_order_id=?"
    ).get(razorpay_order_id);
    if (!orderRow) throw new HttpError(404, "Order not found.");
    if (orderRow.status === "paid") return res.json({ ok: true, alreadyPaid: true });

    db.transaction(() => {
      db.prepare(
        `UPDATE payment_orders SET status='paid', razorpay_payment_id=?, verified_at=datetime('now') WHERE razorpay_order_id=?`
      ).run(razorpay_payment_id, razorpay_order_id);
      // Also mark the invoice as Paid in the records table
      const invoiceRow = db.prepare(
        "SELECT rowid, data FROM records WHERE tbl='invoices' AND key=?"
      ).get(orderRow.invoice_key);
      if (invoiceRow) {
        const data = JSON.parse(invoiceRow.data);
        // data[5] is status per schema seed — set it to 'Paid'
        data[5] = "Paid";
        db.prepare("UPDATE records SET data=? WHERE rowid=?").run(JSON.stringify(data), invoiceRow.rowid);
      }
    })();

    svc.audit(req.user.name, "Payment verified and invoice marked paid", orderRow.invoice_key);

    // Queue in-app notification
    try {
      db.prepare(
        `INSERT INTO notification_inbox (user_id, type, title, body, ref_id)
         VALUES (?,?,?,?,?)`
      ).run(
        orderRow.student_id,
        "payment",
        "Payment Received",
        `Your payment of ₹${(orderRow.amount / 100).toLocaleString("en-IN")} has been confirmed.`,
        orderRow.invoice_key
      );
    } catch (_) { /* non-fatal */ }

    res.json({ ok: true, invoiceKey: orderRow.invoice_key });
  }));

  // ── POST /api/payments/webhook
  // Razorpay server-to-server webhook. Requires raw body for HMAC verification.
  app.post("/api/payments/webhook", rawBody, wrap(async (req, res) => {
    const webhookSecret = settings.razorpayWebhookSecret;
    if (!webhookSecret) return res.status(200).json({ ok: true }); // ignore if not configured

    const sig = req.headers["x-razorpay-signature"];
    if (!sig) return res.status(400).json({ detail: "Missing signature." });

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body) // raw Buffer from express.raw()
      .digest("hex");
    if (sig !== expected) {
      return res.status(400).json({ detail: "Invalid webhook signature." });
    }

    let event;
    try { event = JSON.parse(req.body.toString()); } catch {
      return res.status(400).json({ detail: "Invalid JSON." });
    }

    // Handle payment.failed event
    if (event?.event === "payment.failed") {
      const orderPayload = event?.payload?.payment?.entity;
      const razorpayOrderId = orderPayload?.order_id;
      if (razorpayOrderId) {
        db.prepare(
          "UPDATE payment_orders SET status='failed' WHERE razorpay_order_id=? AND status='created'"
        ).run(razorpayOrderId);
        svc.audit("Razorpay", "Payment failed", razorpayOrderId);
      }
    }

    // Handle payment.captured (alternative path to /verify)
    if (event?.event === "payment.captured") {
      const paymentEntity = event?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      if (razorpayOrderId && razorpayPaymentId) {
        const orderRow = db.prepare(
          "SELECT * FROM payment_orders WHERE razorpay_order_id=?"
        ).get(razorpayOrderId);
        if (orderRow && orderRow.status !== "paid") {
          db.transaction(() => {
            db.prepare(
              `UPDATE payment_orders SET status='paid', razorpay_payment_id=?, verified_at=datetime('now') WHERE razorpay_order_id=?`
            ).run(razorpayPaymentId, razorpayOrderId);
            const invoiceRow = db.prepare(
              "SELECT rowid, data FROM records WHERE tbl='invoices' AND key=?"
            ).get(orderRow.invoice_key);
            if (invoiceRow) {
              const data = JSON.parse(invoiceRow.data);
              data[5] = "Paid";
              db.prepare("UPDATE records SET data=? WHERE rowid=?").run(JSON.stringify(data), invoiceRow.rowid);
            }
          })();
          svc.audit("Razorpay", "Payment captured via webhook", razorpayOrderId);
        }
      }
    }

    res.status(200).json({ ok: true });
  }));
}
