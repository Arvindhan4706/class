// Start the academy website:  npm run dev
import { settings } from "./config.js";
import { createApp } from "./app.js";
import { seedIfEmpty } from "./seed.js";

await seedIfEmpty();
const app = createApp();
const server = app.listen(settings.port, () => {
  console.log(`\n  Nritya Laya Academy is running:  http://localhost:${settings.port}\n`);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error(`\n  Port ${settings.port} is already in use. Run with another port, e.g.  PORT=3001 npm run dev  (or set PORT in .env)\n`);
  else console.error(e);
  process.exit(1);
});
