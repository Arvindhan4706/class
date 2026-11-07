// Runtime configuration from environment variables and an optional .env file.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (let line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (v !== "" && process.env[k] === undefined) process.env[k] = v;
  }
}
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== "" ? process.env[k] : d);

const dataDir = env("DATA_DIR", path.join(ROOT, "data"));
fs.mkdirSync(dataDir, { recursive: true });

function secret() {
  if (process.env.SECRET_KEY) return process.env.SECRET_KEY;
  const f = path.join(dataDir, ".secret_key");
  try { return fs.readFileSync(f, "utf8").trim(); } catch {}
  const v = crypto.randomBytes(48).toString("base64url");
  try { fs.writeFileSync(f, v, { mode: 0o600 }); } catch {}
  return v;
}

const prod = process.argv.includes("--prod");
const adminPassword = env("ADMIN_PASSWORD", "");

export const settings = {
  port: Number(env("PORT", "3000")),
  dbFile: env("DB_FILE", path.join(dataDir, "nritya.db")),
  secretKey: secret(),
  tokenHours: Number(env("TOKEN_HOURS", "12")),
  tz: env("TZ_NAME", "Asia/Kolkata"),
  corsOrigins: env("CORS_ORIGINS", "*").split(",").map((s) => s.trim()).filter(Boolean),
  frontendFile: env("FRONTEND_FILE", path.join(ROOT, "public", "index.html")),
  paymentMode: env("PAYMENT_MODE", "demo"),
  attendanceWindowDays: Number(env("ATTENDANCE_WINDOW_DAYS", "200")),
  maxBodyMb: Number(env("MAX_BODY_MB", "25")),
  adminEmail: env("ADMIN_EMAIL", "admin@example.com"),
  adminPassword,
  // sample data: on for `npm run dev`, off for `npm start` or when a real admin password is configured
  seedDemo: process.env.SEED_DEMO !== undefined && process.env.SEED_DEMO !== "" ? process.env.SEED_DEMO === "1" : !prod && !adminPassword,
  trustProxy: env("TRUST_PROXY", "0") === "1",
  demoPassword: env("DEMO_PASSWORD", "Demo@12345"),
  prod,
  razorpayKeyId: env("RAZORPAY_KEY_ID", ""),
  razorpayKeySecret: env("RAZORPAY_KEY_SECRET", ""),
  razorpayWebhookSecret: env("RAZORPAY_WEBHOOK_SECRET", ""),
  smtpHost: env("SMTP_HOST", ""),
  smtpPort: Number(env("SMTP_PORT", "587")),
  smtpUser: env("SMTP_USER", ""),
  smtpPass: env("SMTP_PASS", ""),
  smtpFrom: env("SMTP_FROM", "noreply@example.com"),
  whatsappToken: env("WHATSAPP_TOKEN", ""),
  whatsappPhoneId: env("WHATSAPP_PHONE_NUMBER_ID", ""),
  smsApiKey: env("SMS_API_KEY", ""),
  smsSenderId: env("SMS_SENDER_ID", "NRITYA"),
  backupRetainDays: Number(env("BACKUP_RETAIN_DAYS", "30")),
  nodeEnv: env("NODE_ENV", "development"),
};
