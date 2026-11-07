// server/lib/notify.js — unified notification dispatcher — Phase 2
// Outbox pattern: notify() queues into the notifications table; flushNotifications() delivers.
import { db } from "../db.js";
import { settings } from "../config.js";

export const CHANNELS = { INAPP: "inapp", EMAIL: "email", WHATSAPP: "whatsapp", SMS: "sms" };

/**
 * Queue a notification for delivery.
 * @param {string} userId    recipient user ID
 * @param {string} template  e.g. "attendance_marked", "fee_due"
 * @param {object} data      template variables (plain-object, JSON-serialisable)
 * @param {string[]} channels which channels to use
 */
export function notify(userId, template, data = {}, channels = [CHANNELS.INAPP]) {
  const payload = JSON.stringify(data);
  for (const channel of channels) {
    try {
      db.prepare(
        "INSERT INTO notifications (user_id, channel, template, payload) VALUES (?, ?, ?, ?)"
      ).run(userId, channel, template, payload);
    } catch (e) {
      console.error(`[notify] Failed to queue ${channel}/${template} for ${userId}:`, e.message);
    }
  }
}

/**
 * Convenience: notify a student AND queue in-app inbox entry.
 */
export function notifyStudent(studentId, template, data, channels = [CHANNELS.INAPP, CHANNELS.EMAIL, CHANNELS.WHATSAPP]) {
  // Always queue outbox entries for external channels
  notify(studentId, template, data, channels);
  // Also insert into in-app inbox (notification_inbox) for immediate UI display
  try {
    const { title, body } = inboxEntry(template, data);
    db.prepare(
      "INSERT INTO notification_inbox (user_id, type, title, body, ref_id) VALUES (?,?,?,?,?)"
    ).run(studentId, template.split("_")[0], title, body, data.refId || "");
  } catch (_) { /* non-fatal */ }
}

function inboxEntry(template, data) {
  switch (template) {
    case "attendance_marked":
      return {
        title: `Attendance — ${data.status === "late" ? "⚠️ Late" : "✅ Present"} on ${data.date}`,
        body: `Marked ${data.status} for ${data.batchName || "class"}.${data.lateMinutes > 0 ? ` (${data.lateMinutes} min late)` : ""}`,
      };
    case "fee_due":
      return { title: "Fee Invoice Due", body: `₹${data.amount} due by ${data.dueDate} for ${data.month}.` };
    case "payment_confirmed":
      return { title: "Payment Received ✅", body: `₹${data.amount} confirmed. Receipt: ${data.receiptNo}.` };
    case "announcement":
      return { title: data.title, body: String(data.body).slice(0, 200) };
    default:
      return { title: "Academy Notification", body: JSON.stringify(data).slice(0, 200) };
  }
}

/**
 * Process pending outbox notifications and dispatch to real channels.
 * Called by a cron job every few minutes (see jobs/notify-flush.js).
 * Returns { sent, failed }.
 */
export async function flushNotifications() {
  const pending = db.prepare(
    `SELECT * FROM notifications
     WHERE status='pending' AND channel != 'inapp'
     ORDER BY created_at
     LIMIT 50`
  ).all();

  let sent = 0, failed = 0;

  for (const n of pending) {
    let data;
    try { data = JSON.parse(n.payload); } catch { data = {}; }

    // Resolve the user's email and phone for delivery
    const user = db.prepare("SELECT email, phone FROM users WHERE id=?").get(n.user_id);
    if (!user) {
      db.prepare("UPDATE notifications SET status='failed' WHERE id=?").run(n.id);
      failed++;
      continue;
    }

    try {
      switch (n.channel) {
        case CHANNELS.EMAIL: {
          if (!user.email) throw new Error("User has no email.");
          const { sendEmail } = await import("./channels/email.js");
          await sendEmail(user.email, n.template, data);
          break;
        }
        case CHANNELS.WHATSAPP: {
          if (!user.phone) throw new Error("User has no phone.");
          const { sendWhatsApp } = await import("./channels/whatsapp.js");
          await sendWhatsApp(user.phone, n.template, data);
          break;
        }
        case CHANNELS.SMS: {
          if (!user.phone) throw new Error("User has no phone.");
          const { sendSms } = await import("./channels/sms.js");
          await sendSms(user.phone, n.template, data);
          break;
        }
        default:
          // inapp — already handled at notify() time, mark sent
          break;
      }
      db.prepare("UPDATE notifications SET status='sent', sent_at=datetime('now') WHERE id=?").run(n.id);
      sent++;
    } catch (e) {
      console.error(`[notify] Error sending ${n.channel}/${n.template} #${n.id}:`, e.message);
      db.prepare("UPDATE notifications SET status='failed' WHERE id=?").run(n.id);
      failed++;
    }
  }

  if (sent + failed > 0) console.log(`[notify] flush: sent=${sent} failed=${failed}`);
  return { sent, failed };
}
