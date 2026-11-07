// server/lib/channels/email.js
// Email delivery channel via Nodemailer (SMTP) — Phase 2
import { settings } from "../../config.js";

let _transporter = null;

/** Lazy-load and cache the Nodemailer transporter. */
async function getTransporter() {
  if (_transporter) return _transporter;
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new Error("SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing).");
  }
  const { default: nodemailer } = await import("nodemailer");
  _transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
    pool: true,
    maxConnections: 3,
  });
  await _transporter.verify();
  return _transporter;
}

/**
 * Render a notification template into { subject, html, text }.
 * @param {string} template  e.g. "attendance_marked"
 * @param {object} data      template variables
 */
function renderTemplate(template, data) {
  switch (template) {
    case "attendance_marked":
      return {
        subject: `Attendance — ${data.status === "late" ? "⚠️ Late" : "✅ Present"} on ${data.date}`,
        text: `Dear ${data.studentName},\n\nYour attendance was recorded as ${data.status} for ${data.batchName || "class"} on ${data.date}.\n\n— Nritya Laya Academy`,
        html: `<p>Dear <strong>${esc(data.studentName)}</strong>,</p>
<p>Your attendance was recorded as <strong>${esc(data.status)}</strong> for <em>${esc(data.batchName || "class")}</em> on <strong>${esc(data.date)}</strong>.</p>
<p style="color:#888;font-size:12px;">— Nritya Laya Academy</p>`,
      };

    case "fee_due":
      return {
        subject: `📋 Fee Invoice Due — ₹${data.amount}`,
        text: `Dear ${data.studentName},\n\nYour monthly fee invoice of ₹${data.amount} for ${data.month} is due by ${data.dueDate}.\n\nPlease log in to your portal to pay.\n\n— Nritya Laya Academy`,
        html: `<p>Dear <strong>${esc(data.studentName)}</strong>,</p>
<p>Your monthly fee invoice of <strong>₹${esc(String(data.amount))}</strong> for ${esc(data.month)} is due by <strong>${esc(data.dueDate)}</strong>.</p>
<p><a href="${esc(data.portalUrl || "#")}">Pay now in the portal →</a></p>
<p style="color:#888;font-size:12px;">— Nritya Laya Academy</p>`,
      };

    case "payment_confirmed":
      return {
        subject: `✅ Payment Received — ₹${data.amount}`,
        text: `Dear ${data.studentName},\n\nWe have received your payment of ₹${data.amount}. Thank you!\n\nReceipt no: ${data.receiptNo}\n\n— Nritya Laya Academy`,
        html: `<p>Dear <strong>${esc(data.studentName)}</strong>,</p>
<p>We have received your payment of <strong>₹${esc(String(data.amount))}</strong>. Thank you!</p>
<p>Receipt no: <code>${esc(data.receiptNo)}</code></p>
<p style="color:#888;font-size:12px;">— Nritya Laya Academy</p>`,
      };

    case "password_reset":
      return {
        subject: "🔑 Reset your Nritya Laya password",
        text: `Hi ${data.name},\n\nClick the link below to reset your password (valid for 1 hour):\n\n${data.resetUrl}\n\nIf you didn't request this, ignore this email.\n\n— Nritya Laya Academy`,
        html: `<p>Hi <strong>${esc(data.name)}</strong>,</p>
<p><a href="${esc(data.resetUrl)}">Reset your password →</a></p>
<p style="color:#888;font-size:12px;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
<p style="color:#888;font-size:12px;">— Nritya Laya Academy</p>`,
      };

    case "announcement":
      return {
        subject: `📢 ${data.title}`,
        text: `${data.title}\n\n${data.body}\n\n— Nritya Laya Academy`,
        html: `<h2>${esc(data.title)}</h2><p>${esc(data.body).replace(/\n/g, "<br>")}</p>
<p style="color:#888;font-size:12px;">— Nritya Laya Academy</p>`,
      };

    default:
      return {
        subject: `Notification from Nritya Laya Academy`,
        text: JSON.stringify(data, null, 2),
        html: `<pre>${esc(JSON.stringify(data, null, 2))}</pre>`,
      };
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send an email notification.
 * @param {string} toEmail  recipient email address
 * @param {string} template notification template name
 * @param {object} data     template variables
 */
export async function sendEmail(toEmail, template, data) {
  const transport = await getTransporter();
  const { subject, text, html } = renderTemplate(template, data);
  await transport.sendMail({
    from: `"Nritya Laya Academy" <${settings.smtpFrom}>`,
    to: toEmail,
    subject,
    text,
    html,
  });
}
