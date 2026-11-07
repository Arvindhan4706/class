// Start the academy website:  npm run dev
import { settings } from "./config.js";
import { createApp } from "./app.js";
import { seedIfEmpty } from "./seed.js";
import { runMigrations } from "./lib/migrations.js";
import { setupBackupJob } from "./jobs/backup.js";
import { setupInvoicingJob } from "./jobs/invoicing.js";
import { setupNotifyFlushJob } from "./jobs/notify-flush.js";

// Run DB migrations before seeding or starting the app
runMigrations();

await seedIfEmpty();
const app = createApp();

// Start background cron jobs
setupBackupJob();
setupInvoicingJob();
setupNotifyFlushJob();
const server = app.listen(settings.port, () => {
  console.log(`\n  Nritya Laya Academy is running:  http://localhost:${settings.port}\n`);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error(`\n  Port ${settings.port} is already in use. Run with another port, e.g.  PORT=3001 npm run dev  (or set PORT in .env)\n`);
  else console.error(e);
  process.exit(1);
});
