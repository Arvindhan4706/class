// server/lib/channels/sms.js
// SMS delivery via MSG91 API — Phase 2
// Docs: https://docs.msg91.com/reference/send-sms
import { settings } from "../../config.js";

const MSG91_URL = "https://control.msg91.com/api/v5/flow/";

/**
 * Send an SMS via MSG91 flow API.
 * @param {string} toPhone  phone number, e.g. "919876543210" or "9876543210"
 * @param {string} template notification template name
 * @param {object} data     template variables
 */
export async function sendSms(toPhone, template, data) {
  if (!settings.smsApiKey) {
    throw new Error("SMS not configured (SMS_API_KEY missing).");
  }

  // Normalise: strip non-digits, prepend 91 for 10-digit Indian numbers
  let phone = String(toPhone).replace(/[^0-9]/g, "");
  if (phone.length === 10) phone = "91" + phone;
  if (phone.length < 10) throw new Error(`Invalid phone number: ${toPhone}`);

  const text = renderText(template, data);

  // MSG91 simple text API (non-template DLT — for OTP/transactional use flow API)
  const body = {
    sender: settings.smsSenderId || "NRITYA",
    route: "4", // transactional
    country: "91",
    sms: [{ message: text, to: [phone] }],
  };

  const res = await fetch("https://api.msg91.com/api/sendhttp.php", {
    method: "POST",
    headers: {
      "authkey": settings.smsApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MSG91 API error ${res.status}: ${err}`);
  }
  return res.text();
}

/** Render a compact SMS body (keep under 160 chars for single-part SMS). */
function renderText(template, data) {
  switch (template) {
    case "attendance_marked":
      return `Nritya Laya: ${data.studentName} marked ${data.status} on ${data.date}${data.lateMinutes > 0 ? ` (${data.lateMinutes}min late)` : ""}.`;

    case "fee_due":
      return `Nritya Laya: Fee of Rs.${data.amount} due by ${data.dueDate} for ${data.month}. Login to pay.`;

    case "payment_confirmed":
      return `Nritya Laya: Received Rs.${data.amount}. Receipt: ${data.receiptNo}. Thank you!`;

    case "password_reset":
      return `Nritya Laya: Reset your password: ${data.resetUrl}`;

    case "announcement":
      return `Nritya Laya: ${data.title} - ${String(data.body).slice(0, 100)}`;

    default:
      return `Nritya Laya Academy notification. Login to portal for details.`;
  }
}
