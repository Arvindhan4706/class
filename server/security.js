import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { settings } from "./config.js";

const MAX_PW_BYTES = 72; // bcrypt limit
const ROUNDS = 10;

export function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(pw) > MAX_PW_BYTES) return "Password is too long (max 72 bytes).";
  return null;
}
export const hashPassword = (pw) => bcrypt.hash(pw, ROUNDS);
const DUMMY = bcrypt.hashSync("dummy-password", ROUNDS);

/** Always does one bcrypt comparison so unknown users and wrong passwords take similar time. */
export async function verifyPassword(pw, hashed) {
  try {
    const p = Buffer.from(pw).subarray(0, MAX_PW_BYTES).toString("utf8");
    if (!hashed) { await bcrypt.compare(p, DUMMY); return false; }
    return await bcrypt.compare(p, hashed);
  } catch { return false; }
}

export const makeToken = (id) => jwt.sign({ sub: id }, settings.secretKey, { algorithm: "HS256", expiresIn: settings.tokenHours * 3600 });
export function readToken(t) {
  try { return jwt.verify(t, settings.secretKey, { algorithms: ["HS256"] }).sub || null; } catch { return null; }
}

/** Sliding-window limiter kept in memory (per process). Use nginx/Redis limits if you run several processes. */
class RateLimiter {
  hits = new Map();
  _prune(key, windowSec) {
    const q = this.hits.get(key) || [];
    const now = Date.now();
    while (q.length && now - q[0] > windowSec * 1000) q.shift();
    this.hits.set(key, q);
    return q;
  }
  blocked(key, limit, windowSec) { return this._prune(key, windowSec).length >= limit; }
  hit(key, windowSec) { this._prune(key, windowSec).push(Date.now()); }
  reset(key) { this.hits.delete(key); }
  clear() { this.hits.clear(); }
}
export const limiter = new RateLimiter();
