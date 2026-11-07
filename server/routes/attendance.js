// server/routes/attendance.js
// QR-based attendance routes — Phase 1
import crypto from "node:crypto";
import { db } from "../db.js";
import { settings } from "../config.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const isAdmin = (u) => u.role === "admin";
const isTeacher = (u) => u.role === "teacher";
const isStudent = (u) => u.role === "student";
const isParent = (u) => u.role === "parent";
const canManageAttendance = (u) => isAdmin(u) || isTeacher(u);

/** Sign a short-lived QR token for a student (5-minute TTL). */
function signQrToken(studentId) {
  const payload = Buffer.from(
    JSON.stringify({ sub: studentId, exp: Date.now() + 5 * 60 * 1000 })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", settings.secretKey)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify a QR token; throws HttpError on failure. */
function verifyQrToken(token) {
  const [payload, sig] = (token || "").split(".");
  if (!payload || !sig) throw new HttpError(400, "Invalid QR token.");
  const expected = crypto
    .createHmac("sha256", settings.secretKey)
    .update(payload)
    .digest("base64url");
  if (sig !== expected) throw new HttpError(400, "Invalid QR token.");
  let data;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch {
    throw new HttpError(400, "Invalid QR token.");
  }
  if (!data.exp || Date.now() > data.exp) throw new HttpError(400, "QR token expired. Please refresh.");
  return data.sub; // studentId
}

export function attendanceRoutes(app, auth) {
  // ── GET /api/attendance/qr/:studentId
  // Returns a signed QR payload. Student can get their own; teacher/admin can get anyone's.
  app.get("/api/attendance/qr/:studentId", auth, wrap(async (req, res) => {
    const { studentId } = req.params;
    const u = req.user;
    if (isStudent(u) && u.id !== studentId) throw new HttpError(403, "You can only view your own QR code.");
    if (isParent(u)) {
      // Parent can get QR for their linked children
      const linked = db.prepare(
        "SELECT student_id FROM guardians WHERE email=? OR phone=?"
      ).all(u.email || "", u.phone || "");
      const ids = linked.map((r) => r.student_id);
      if (!ids.includes(studentId)) throw new HttpError(403, "You can only view your child's QR code.");
    }
    const student = db.prepare("SELECT id, name FROM users WHERE id=? AND role='student'").get(studentId);
    if (!student) throw new HttpError(404, "Student not found.");
    const token = signQrToken(studentId);
    res.json({ studentId, studentName: student.name, token });
  }));

  // ── POST /api/attendance/scan
  // Teacher/admin scans a QR token and records attendance for a batch + date.
  app.post("/api/attendance/scan", auth, wrap(async (req, res) => {
    const u = req.user;
    if (!canManageAttendance(u)) throw new HttpError(403, "Only teachers and admins can mark attendance.");
    const b = req.body;
    const token = typeof b?.token === "string" ? b.token.trim() : "";
    const batchId = typeof b?.batchId === "string" ? b.batchId.trim() : "";
    if (!token) throw new HttpError(422, "Missing QR token.");
    if (!batchId) throw new HttpError(422, "Missing batchId.");

    const studentId = verifyQrToken(token);

    // Verify the teacher manages this batch (admin can mark any batch)
    if (isTeacher(u)) {
      const batchRow = db.prepare("SELECT data FROM records WHERE tbl='batches' AND key=?").get(batchId);
      if (!batchRow) throw new HttpError(404, "Batch not found.");
      const batchData = JSON.parse(batchRow.data);
      // batchData[2] is typically the teacher field (depends on schema)
      // We just check the teacher is assigned — we look for u.id anywhere in the batch data
      const teacherAssigned = JSON.stringify(batchData).includes(u.id);
      if (!teacherAssigned) throw new HttpError(403, "You are not assigned to this batch.");
    }

    const student = db.prepare("SELECT id, name FROM users WHERE id=? AND role='student'").get(studentId);
    if (!student) throw new HttpError(404, "Student not found.");

    const scanDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const scanTime = new Date().toISOString().slice(11, 19); // HH:MM:SS (UTC)

    // Calculate late minutes using batch start time from records
    let lateMinutes = 0;
    const batchRow2 = db.prepare("SELECT data FROM records WHERE tbl='batches' AND key=?").get(batchId);
    if (batchRow2) {
      const batchData = JSON.parse(batchRow2.data);
      // Try to find startTime field (typically batchData[n] with "HH:MM" format)
      const startTimeStr = batchData.find?.((v) => typeof v === "string" && /^\d{2}:\d{2}$/.test(v));
      if (startTimeStr) {
        const [sh, sm] = startTimeStr.split(":").map(Number);
        const now = new Date();
        const classStart = new Date(now);
        classStart.setUTCHours(sh - 5, sm - 30, 0, 0); // IST to UTC offset
        const diffMs = now - classStart;
        if (diffMs > 0) {
          lateMinutes = Math.floor(diffMs / 60000);
          if (lateMinutes < 0) lateMinutes = 0;
        }
      }
    }

    // Check for duplicate scan on the same date
    const existing = db.prepare(
      "SELECT id FROM attendance_scans WHERE batch_id=? AND student_id=? AND scan_date=?"
    ).get(batchId, studentId, scanDate);
    if (existing) {
      throw new HttpError(409, `${student.name} is already marked present for today.`);
    }

    const lateThreshold = Number(
      db.prepare("SELECT value FROM kv WHERE key='lateArrivalThresholdMins'").get()?.value ?? 10
    );
    const status = lateMinutes > lateThreshold ? "late" : "present";

    db.prepare(
      `INSERT INTO attendance_scans (batch_id, student_id, scan_date, scan_time, status, late_minutes, marked_by)
       VALUES (?,?,?,?,?,?,?)`
    ).run(batchId, studentId, scanDate, scanTime, status, lateMinutes, u.id);

    svc.audit(u.name, `Marked attendance: ${status}`, studentId);

    // Queue in-app notification to student (Phase 2 will also deliver via email/SMS/WhatsApp)
    try {
      db.prepare(
        `INSERT INTO notification_inbox (user_id, type, title, body, ref_id)
         VALUES (?,?,?,?,?)`
      ).run(
        studentId,
        "attendance",
        "Attendance Marked",
        `You were marked ${status} for class on ${scanDate}.`,
        batchId
      );
    } catch (_) { /* non-fatal if migration hasn't run yet */ }

    res.json({ ok: true, studentId, studentName: student.name, status, lateMinutes, scanDate });
  }));

  // ── GET /api/attendance/batch/:batchId?date=YYYY-MM
  // Returns attendance scans for a batch for a given month (default: current month).
  app.get("/api/attendance/batch/:batchId", auth, wrap(async (req, res) => {
    const u = req.user;
    if (!canManageAttendance(u)) throw new HttpError(403, "Access denied.");
    const { batchId } = req.params;
    const month = typeof req.query.date === "string" ? req.query.date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const rows = db.prepare(
      `SELECT s.*, u.name AS student_name
       FROM attendance_scans s
       JOIN users u ON u.id = s.student_id
       WHERE s.batch_id=? AND s.scan_date LIKE ?
       ORDER BY s.scan_date, u.name`
    ).all(batchId, `${month}%`);
    res.json({ batchId, month, records: rows });
  }));

  // ── GET /api/attendance/student/:studentId?date=YYYY-MM
  // Student/parent sees own record; teacher/admin can see any.
  app.get("/api/attendance/student/:studentId", auth, wrap(async (req, res) => {
    const u = req.user;
    const { studentId } = req.params;
    if (isStudent(u) && u.id !== studentId) throw new HttpError(403, "You can only view your own attendance.");
    if (isParent(u)) {
      const linked = db.prepare(
        "SELECT student_id FROM guardians WHERE email=? OR phone=?"
      ).all(u.email || "", u.phone || "");
      if (!linked.some((r) => r.student_id === studentId)) throw new HttpError(403, "You can only view your child's attendance.");
    }
    const month = typeof req.query.date === "string" ? req.query.date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const rows = db.prepare(
      `SELECT s.*, b.data AS batch_raw
       FROM attendance_scans s
       LEFT JOIN records b ON b.tbl='batches' AND b.key=s.batch_id
       WHERE s.student_id=? AND s.scan_date LIKE ?
       ORDER BY s.scan_date`
    ).all(studentId, `${month}%`);

    // Compute summary stats
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present").length;
    const late = rows.filter((r) => r.status === "late").length;
    const absent = rows.filter((r) => r.status === "absent").length;

    res.json({ studentId, month, records: rows, summary: { total, present, late, absent } });
  }));

  // ── POST /api/attendance/correction
  // Student/parent requests a correction; admin/teacher can approve it.
  app.post("/api/attendance/correction", auth, wrap(async (req, res) => {
    const u = req.user;
    const b = req.body;
    const scanId = typeof b?.scanId === "number" ? b.scanId : null;
    const note = typeof b?.note === "string" ? b.note.trim() : "";
    if (!scanId) throw new HttpError(422, "Missing scanId.");
    if (!note) throw new HttpError(422, "Please describe the correction needed.");

    const scan = db.prepare("SELECT * FROM attendance_scans WHERE id=?").get(scanId);
    if (!scan) throw new HttpError(404, "Attendance record not found.");

    // Students can only request corrections for themselves
    if (isStudent(u) && scan.student_id !== u.id) throw new HttpError(403, "Access denied.");
    // Parents can request for their children
    if (isParent(u)) {
      const linked = db.prepare(
        "SELECT student_id FROM guardians WHERE email=? OR phone=?"
      ).all(u.email || "", u.phone || "");
      if (!linked.some((r) => r.student_id === scan.student_id)) throw new HttpError(403, "Access denied.");
    }

    // If admin/teacher: approve the correction directly
    if (canManageAttendance(u)) {
      const newStatus = typeof b?.status === "string" ? b.status : scan.status;
      db.prepare(
        "UPDATE attendance_scans SET status=?, correction_note=?, correction_requested=0 WHERE id=?"
      ).run(newStatus, note, scanId);
      svc.audit(u.name, `Approved attendance correction`, String(scanId));
      return res.json({ ok: true, approved: true });
    }

    // Otherwise: flag for review
    db.prepare(
      "UPDATE attendance_scans SET correction_requested=1, correction_note=? WHERE id=?"
    ).run(note, scanId);
    svc.audit(u.name, `Requested attendance correction`, String(scanId));
    res.json({ ok: true, approved: false, message: "Correction request submitted. The admin will review it." });
  }));
}
