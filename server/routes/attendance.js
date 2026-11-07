// server/routes/attendance.js — QR-based attendance system
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { settings } from "../config.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";
import { notifyStudent, CHANNELS } from "../lib/notify.js";

const bad = (msg) => new HttpError(422, msg);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

/** Generate a short-lived QR token for a student */
export function attendanceRoutes(app, auth) {
  // GET /api/attendance/qr/:studentId
  // Returns a signed token the student can display as a QR code
  app.get("/api/attendance/qr/:studentId", auth, wrap(async (req, res) => {
    const { studentId } = req.params;
    const u = req.user;
    // Students can only get their own QR; teachers/admins can get any
    if (u.role === "student" && u.id !== studentId) throw new HttpError(403, "Forbidden.");
    const target = db.prepare("SELECT id, name FROM users WHERE id=? AND status='Active'").get(studentId);
    if (!target) throw new HttpError(404, "Student not found.");

    const payload = { sub: target.id, name: target.name, type: "attendance_qr" };
    const token = jwt.sign(payload, settings.secretKey, { algorithm: "HS256", expiresIn: 300 }); // 5 min

    res.json({ token, studentId: target.id, name: target.name, expiresInSeconds: 300 });
  }));

  // POST /api/attendance/scan
  // Teacher scans a QR token and marks attendance
  app.post("/api/attendance/scan", auth, wrap(async (req, res) => {
    if (!["teacher", "admin"].includes(req.user.role)) throw new HttpError(403, "Only teachers can mark attendance.");
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const { token, batchId, date } = b;
    if (!token || !batchId || !date) throw bad("token, batchId and date are required.");

    let payload;
    try {
      payload = jwt.verify(token, settings.secretKey, { algorithms: ["HS256"] });
    } catch {
      throw new HttpError(400, "Invalid or expired QR code. Ask the student to refresh their code.");
    }
    if (payload.type !== "attendance_qr") throw new HttpError(400, "Invalid QR code type.");

    const studentId = payload.sub;
    const scanTime = new Date().toISOString();

    // Check for duplicate
    const existing = db.prepare(
      "SELECT id, status FROM attendance_scans WHERE batch_id=? AND student_id=? AND scan_date=?"
    ).get(batchId, studentId, date);

    if (existing) {
      return res.json({ ok: true, duplicate: true, status: existing.status, message: "Attendance already recorded for today." });
    }

    // Calculate late minutes (placeholder — real logic needs class start time from timetable)
    const lateMinutes = 0;
    const status = lateMinutes > (settings.lateThresholdMinutes || 15) ? "late" : "present";

    db.prepare(
      `INSERT INTO attendance_scans (batch_id, student_id, scan_date, scan_time, status, late_minutes, marked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(batchId, studentId, date, scanTime, status, lateMinutes, req.user.id);

    svc.audit(req.user.name, `Marked attendance: ${status}`, `${studentId}@${batchId}`);
    res.json({ ok: true, duplicate: false, studentId, status, date });

    // Fire notification to student (after responding — non-blocking)
    try {
      notifyStudent(studentId, "attendance_marked", {
        studentName: payload.name || "Student",
        status,
        date,
        batchName: batchId,
        lateMinutes,
        refId: batchId,
      }, [CHANNELS.INAPP, CHANNELS.EMAIL, CHANNELS.WHATSAPP]);
    } catch (_) { /* non-fatal */ }
  }));

  // GET /api/attendance/batch/:batchId?date=YYYY-MM
  // Returns attendance list for a batch, optionally filtered by month
  app.get("/api/attendance/batch/:batchId", auth, wrap(async (req, res) => {
    const { batchId } = req.params;
    const month = req.query.date || new Date().toISOString().slice(0, 7); // YYYY-MM
    const rows = db.prepare(
      `SELECT s.student_id, u.name, s.scan_date, s.scan_time, s.status, s.late_minutes, s.correction_requested
       FROM attendance_scans s
       JOIN users u ON u.id = s.student_id
       WHERE s.batch_id = ? AND s.scan_date LIKE ?
       ORDER BY s.scan_date, u.name`
    ).all(batchId, `${month}%`);
    res.json({ batchId, month, rows });
  }));

  // GET /api/attendance/student/:studentId?date=YYYY-MM
  // Student/parent view of attendance history
  app.get("/api/attendance/student/:studentId", auth, wrap(async (req, res) => {
    const { studentId } = req.params;
    if (req.user.role === "student" && req.user.id !== studentId) throw new HttpError(403, "Forbidden.");
    const month = req.query.date || new Date().toISOString().slice(0, 7);
    const rows = db.prepare(
      `SELECT scan_date, scan_time, status, late_minutes, batch_id, correction_requested, correction_note
       FROM attendance_scans
       WHERE student_id = ? AND scan_date LIKE ?
       ORDER BY scan_date DESC`
    ).all(studentId, `${month}%`);
    res.json({ studentId, month, rows });
  }));

  // POST /api/attendance/correction
  // Student/parent requests a correction to an attendance record
  app.post("/api/attendance/correction", auth, wrap(async (req, res) => {
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const { batchId, date, note } = b;
    if (!batchId || !date) throw bad("batchId and date are required.");
    const studentId = req.user.role === "student" ? req.user.id : b.studentId;
    if (!studentId) throw bad("studentId is required.");

    const row = db.prepare(
      "SELECT id FROM attendance_scans WHERE batch_id=? AND student_id=? AND scan_date=?"
    ).get(batchId, studentId, date);

    if (row) {
      db.prepare("UPDATE attendance_scans SET correction_requested=1, correction_note=? WHERE id=?")
        .run(note || "", row.id);
    } else {
      // Absent — create a record flagged as correction request
      db.prepare(
        `INSERT INTO attendance_scans (batch_id, student_id, scan_date, scan_time, status, marked_by, correction_requested, correction_note)
         VALUES (?, ?, ?, '', 'absent', ?, 1, ?)`
      ).run(batchId, studentId, date, req.user.id, note || "");
    }

    svc.audit(req.user.name, "Requested attendance correction", `${studentId}@${batchId}@${date}`);
    res.json({ ok: true });
  }));
}
