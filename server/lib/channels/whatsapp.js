// server/lib/channels/whatsapp.js
// WhatsApp delivery via Meta Cloud API — Phase 2
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
import { settings } from "../../config.js";

const API_VERSION = "v20.0";

/**
 * Send a WhatsApp text message via Meta Cloud API.
 * @param {string} toPhone  phone number in international format, e.g. "919876543210"
 * @param {string} template notification template name
 * @param {object} data     template variables
 */
export async function sendWhatsApp(toPhone, template, data) {
  if (!settings.whatsappToken || !settings.whatsappPhoneId) {
    throw new Error("WhatsApp not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing).");
  }

  // Normalise phone: strip + and spaces, prepend 91 (India) if 10 digits
  let phone = String(toPhone).replace(/[^0-9]/g, "");
  if (phone.length === 10) phone = "91" + phone;
  if (phone.length < 10) throw new Error(`Invalid phone number: ${toPhone}`);

  const text = renderText(template, data);

  const url = `https://graph.facebook.com/${API_VERSION}/${settings.whatsappPhoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: { preview_url: false, body: text },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }
  return res.json();
}

/** Render a plain-text WhatsApp message body from a template. */
function renderText(template, data) {
  switch (template) {
    case "attendance_marked":
      return `🎭 *Nritya Laya Academy*\n\nHi ${data.studentName}, your attendance was recorded as *${data.status}* for ${data.batchName || "class"} on ${data.date}.${data.lateMinutes > 0 ? `\n_(${data.lateMinutes} min late)_` : ""}`;

    case "fee_due":
      return `🎭 *Nritya Laya Academy*\n\nDear ${data.studentName},\n\nYour monthly fee of *₹${data.amount}* for ${data.month} is due by ${data.dueDate}.\n\nPlease log in to your portal to pay.`;

    case "payment_confirmed":
      return `🎭 *Nritya Laya Academy*\n\nDear ${data.studentName},\n\n✅ Payment of *₹${data.amount}* received. Thank you!\n\nReceipt: ${data.receiptNo}`;

    case "password_reset":
      return `🎭 *Nritya Laya Academy*\n\nHi ${data.name},\n\nYour password reset link (expires in 1 hr):\n${data.resetUrl}`;

    case "announcement":
      return `🎭 *Nritya Laya Academy*\n\n📢 *${data.title}*\n\n${data.body}`;

    default:
      return `🎭 *Nritya Laya Academy*\n\n${JSON.stringify(data)}`;
  }
}
