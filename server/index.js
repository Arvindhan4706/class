// Start the academy website:  npm run dev
import fs from "node:fs";
import path from "node:path";
import { ROOT, settings } from "./config.js";
import { createApp } from "./app.js";
import { seedIfEmpty } from "./seed.js";

await seedIfEmpty();
const app = createApp();

// Simple file watcher in dev mode to broadcast changes or reload
const clients = new Set();
if (!settings.prod) {
  app.get("/__live_reload", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("data: connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
  });

  const publicDir = path.join(ROOT, "public");
  let changeTimeout = null;
  fs.watch(publicDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    clearTimeout(changeTimeout);
    changeTimeout = setTimeout(() => {
      console.log(`[live-reload] File changed: ${filename} -> auto-reloading browser clients`);
      for (const res of clients) {
        try { res.write("data: reload\n\n"); } catch {}
      }
    }, 100);
  });
}

const server = app.listen(settings.port, () => {
  console.log(`\n  Nritya Laya Academy is running:  http://localhost:${settings.port}\n`);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error(`\n  Port ${settings.port} is already in use. Run with another port, e.g.  PORT=3001 npm run dev  (or set PORT in .env)\n`);
  else console.error(e);
  process.exit(1);
});
