// server/routes/payments.js — Razorpay integration + PDF receipts + notifications
import crypto from "node:crypto";
import path from "node:path";
import { db } from "../db.js";
import { ROOT, settings } from "../config.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";
import { notifyStudent, CHANNELS } from "../lib/notify.js";
import { generateReceipt, streamReceipt } from "../lib/pdf.js";

const bad = (msg) => new HttpError(422, msg);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

async function getRazorpay() {
  if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
    throw new HttpError(503, "Payment gateway is not configured. Contact the academy admin.");
  }
  // Dynamic import to avoid crashing if razorpay package is absent in pure-demo mode
  const Razorpay = (await import("razorpay")).default;
  return new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret });
}

export function paymentRoutes(app, auth, rawBodyMiddleware) {
  // POST /api/payments/create-order
  // Creates a Razorpay order for an invoice
  app.post("/api/payments/create-order", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const { invoiceKey, amount } = b;
    if (!invoiceKey || typeof invoiceKey !== "string") throw bad("invoiceKey is required.");
    if (!Number.isInteger(amount) || amount < 100) throw bad("amount must be a positive integer (paise).");

    const razorpay = await getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: invoiceKey.slice(0, 40),
      notes: { invoiceKey, studentId: req.user.id },
    });

    db.prepare(
      `INSERT OR REPLACE INTO payment_orders (id, invoice_key, student_id, amount, razorpay_order_id, status)
       VALUES (?, ?, ?, ?, ?, 'created')`
    ).run(crypto.randomUUID(), invoiceKey, req.user.id, amount, order.id);

    res.json({ orderId: order.id, amount, currency: "INR", keyId: settings.razorpayKeyId });
  }));

  // POST /api/payments/verify
  // Verifies payment signature and marks invoice paid
  app.post("/api/payments/verify", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceKey } = b;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw bad("Missing payment verification fields.");
    }

    const expectedSig = crypto
      .createHmac("sha256", settings.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      throw new HttpError(400, "Payment signature verification failed. Please contact support.");
    }

    // Mark order as verified
    const orderRow = db.prepare("SELECT * FROM payment_orders WHERE razorpay_order_id=?").get(razorpay_order_id);
    db.prepare(
      "UPDATE payment_orders SET razorpay_payment_id=?, status='paid', verified_at=datetime('now') WHERE razorpay_order_id=?"
    ).run(razorpay_payment_id, razorpay_order_id);

    svc.audit(req.user.name, "Payment verified", `${invoiceKey} via ${razorpay_payment_id}`);

    // Send notifications to student
    if (orderRow) {
      const studentRow = db.prepare("SELECT name FROM users WHERE id=?").get(orderRow.student_id);
      const receiptNo = `RCP-${orderRow.id.slice(-8).toUpperCase()}`;
      notifyStudent(orderRow.student_id, "payment_confirmed", {
        studentName: studentRow?.name || "Student",
        amount: (orderRow.amount / 100).toLocaleString("en-IN"),
        receiptNo,
        refId: invoiceKey,
      }, [CHANNELS.INAPP, CHANNELS.EMAIL, CHANNELS.WHATSAPP]);
    }

    res.json({ ok: true, paymentId: razorpay_payment_id });
  }));

  // GET /api/payments/receipt/:orderId — download/view PDF receipt
  app.get("/api/payments/receipt/:orderId", auth, wrap(async (req, res) => {
    const order = db.prepare(
      "SELECT * FROM payment_orders WHERE razorpay_order_id=?"
    ).get(req.params.orderId);
    if (!order) throw new HttpError(404, "Order not found.");
    if (req.user.role === "student" && req.user.id !== order.student_id) {
      throw new HttpError(403, "You can only download your own receipts.");
    }

    // Find the student's name
    const student = db.prepare("SELECT name FROM users WHERE id=?").get(order.student_id);
    const receiptNo = `RCP-${order.id.slice(-8).toUpperCase()}`;

    // Generate (or regenerate) the PDF
    const filePath = await generateReceipt({
      receiptNo,
      studentName: student?.name || "Student",
      studentId: order.student_id,
      invoiceNo: order.invoice_key,
      amountPaise: order.amount,
      paymentId: order.razorpay_payment_id || "demo",
      paidOn: order.verified_at || new Date().toISOString(),
      description: `Academy Fee — ${order.invoice_key}`,
    });

    streamReceipt(res, filePath);
  }));

  // POST /api/payments/webhook
  // Razorpay webhook (must be registered in Razorpay dashboard)
  app.post("/api/payments/webhook", rawBodyMiddleware, (req, res) => {
    const sig = req.headers["x-razorpay-signature"];
    if (!sig || !settings.razorpayWebhookSecret) return res.sendStatus(400);

    const expectedSig = crypto
      .createHmac("sha256", settings.razorpayWebhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (expectedSig !== sig) return res.sendStatus(400);

    try {
      const event = JSON.parse(req.rawBody);
      const entity = event?.payload?.payment?.entity;
      if (event.event === "payment.failed" && entity) {
        db.prepare(
          "UPDATE payment_orders SET status='failed' WHERE razorpay_order_id=?"
        ).run(entity.order_id);
        console.log(`[webhook] payment.failed: ${entity.id}`);
      }
    } catch (e) {
      console.error("[webhook] parse error:", e.message);
    }

    res.sendStatus(200);
  });
}
