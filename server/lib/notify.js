// server/lib/notify.js — unified notification dispatcher
import { db } from "../db.js";
import { settings } from "../config.js";

export const CHANNELS = { INAPP: "inapp", EMAIL: "email", WHATSAPP: "whatsapp", SMS: "sms" };

/**
 * Queue a notification for delivery.
 * @param {string} userId - recipient user ID
 * @param {string} template - e.g. "attendance_marked", "fee_due"
 * @param {object} data - template variables
 * @param {string[]} channels - which channels to use
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
 * Send pending notifications (called by the jobs scheduler).
 * Phase 2 will implement actual delivery — this stub logs to console.
 */
export async function flushNotifications() {
  const pending = db.prepare(
    "SELECT * FROM notifications WHERE status='pending' AND channel != 'inapp' ORDER BY created_at LIMIT 50"
  ).all();

  for (const n of pending) {
    try {
      const data = JSON.parse(n.payload);
      console.log(`[notify] [${n.channel}] ${n.template} → user:${n.user_id}`, data);
      // TODO Phase 2: dispatch to actual channel (email, whatsapp, sms)
      db.prepare("UPDATE notifications SET status='sent', sent_at=datetime('now') WHERE id=?").run(n.id);
    } catch (e) {
      console.error(`[notify] Error sending notification ${n.id}:`, e.message);
      db.prepare("UPDATE notifications SET status='failed' WHERE id=?").run(n.id);
    }
  }
}
