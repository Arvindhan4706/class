// server/jobs/notify-flush.js
// Cron job that flushes the notification outbox every 5 minutes — Phase 2
import cron from "node-cron";
import { flushNotifications } from "../lib/notify.js";

export function setupNotifyFlushJob() {
  cron.schedule("*/5 * * * *", () => {
    flushNotifications().catch((e) => console.error("[notify-flush] Error:", e.message));
  });
  console.log("[notify-flush] Notification flush job scheduled (every 5 min).");
}
