// server/routes/assignments.js — practice assignment management (Phase 3)
import { db } from "../db.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";
import crypto from "node:crypto";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const bad = (msg) => new HttpError(422, msg);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const canManage = (u) => u.role === "admin" || u.role === "teacher";

export function assignmentRoutes(app, auth) {

  // ── GET /api/assignments
  // Teacher/admin: list assignments they created.
  // Student: list assignments for their batches or assigned to them directly.
  app.get("/api/assignments", auth, wrap(async (req, res) => {
    const u = req.user;
    let rows;
    if (canManage(u)) {
      rows = db.prepare(
        "SELECT * FROM assignments WHERE created_by=? ORDER BY created_at DESC"
      ).all(u.id);
    } else {
      // Student: assignments for their batch(es) or directly assigned
      rows = db.prepare(
        `SELECT a.* FROM assignments a
         LEFT JOIN batch_members bm ON bm.batch_id = a.batch_id AND bm.student_id = ?
         WHERE a.student_id = ? OR bm.student_id = ?
         ORDER BY a.created_at DESC`
      ).all(u.id, u.id, u.id);
    }

    // Attach submission status for the requesting user if student
    if (u.role === "student" && rows.length) {
      const ids = rows.map((r) => r.id);
      const subs = db.prepare(
        `SELECT assignment_id, status FROM assignment_submissions WHERE student_id=? AND assignment_id IN (${ids.map(() => "?").join(",")})`
      ).all(u.id, ...ids);
      const subMap = Object.fromEntries(subs.map((s) => [s.assignment_id, s.status]));
      rows = rows.map((r) => ({ ...r, submission_status: subMap[r.id] || "pending" }));
    }

    res.json({ assignments: rows });
  }));

  // ── POST /api/assignments
  // Teacher/admin creates an assignment for a batch or individual student
  app.post("/api/assignments", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Only teachers and admins can create assignments.");
    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title) throw bad("title is required.");
    const description = typeof b.description === "string" ? b.description.slice(0, 5000) : "";
    const batchId = typeof b.batch_id === "string" ? b.batch_id.trim() : null;
    const studentId = typeof b.student_id === "string" ? b.student_id.trim() : null;
    const dueDate = typeof b.due_date === "string" ? b.due_date.trim() : null;

    if (!batchId && !studentId) throw bad("Either batch_id or student_id must be specified.");

    const id = `ASN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO assignments (id, batch_id, student_id, title, description, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, batchId, studentId, title, description, dueDate, req.user.id);

    svc.audit(req.user.name, "Created assignment", id);
    res.status(201).json({ ok: true, id });
  }));

  // ── GET /api/assignments/:id
  app.get("/api/assignments/:id", auth, wrap(async (req, res) => {
    const { id } = req.params;
    const assignment = db.prepare("SELECT * FROM assignments WHERE id=?").get(id);
    if (!assignment) throw new HttpError(404, "Assignment not found.");

    const u = req.user;
    // Students can only view if assigned to their batch or directly to them
    if (u.role === "student") {
      const inBatch = assignment.batch_id
        ? db.prepare("SELECT 1 FROM batch_members WHERE batch_id=? AND student_id=?").get(assignment.batch_id, u.id)
        : null;
      if (!inBatch && assignment.student_id !== u.id) throw new HttpError(403, "Access denied.");
    }

    // Attach submissions for teachers/admins
    let submissions = [];
    if (canManage(u)) {
      submissions = db.prepare(
        `SELECT s.*, u.name AS student_name
         FROM assignment_submissions s
         JOIN users u ON u.id = s.student_id
         WHERE s.assignment_id = ?`
      ).all(id);
    } else {
      // Student sees only their own submission
      const sub = db.prepare(
        "SELECT * FROM assignment_submissions WHERE assignment_id=? AND student_id=?"
      ).get(id, u.id);
      if (sub) submissions = [sub];
    }

    res.json({ assignment, submissions });
  }));

  // ── PATCH /api/assignments/:id/submit
  // Student submits (or updates) their assignment
  app.patch("/api/assignments/:id/submit", auth, wrap(async (req, res) => {
    const { id } = req.params;
    const u = req.user;
    if (u.role !== "student") throw new HttpError(403, "Only students can submit assignments.");

    const assignment = db.prepare("SELECT * FROM assignments WHERE id=?").get(id);
    if (!assignment) throw new HttpError(404, "Assignment not found.");

    const b = req.body;
    if (!isObj(b)) throw bad("Invalid request.");
    const note = typeof b.note === "string" ? b.note.slice(0, 2000) : "";

    const existing = db.prepare(
      "SELECT assignment_id FROM assignment_submissions WHERE assignment_id=? AND student_id=?"
    ).get(id, u.id);

    if (existing) {
      db.prepare(
        "UPDATE assignment_submissions SET status='submitted', note=?, submitted_at=datetime('now') WHERE assignment_id=? AND student_id=?"
      ).run(note, id, u.id);
    } else {
      db.prepare(
        "INSERT INTO assignment_submissions (assignment_id, student_id, status, note, submitted_at) VALUES (?,?,'submitted',?,datetime('now'))"
      ).run(id, u.id, note);
    }

    svc.audit(u.name, "Submitted assignment", id);
    res.json({ ok: true });
  }));

  // ── DELETE /api/assignments/:id — admin/teacher deletes an assignment
  app.delete("/api/assignments/:id", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Only teachers and admins can delete assignments.");
    const { id } = req.params;
    const assignment = db.prepare("SELECT created_by FROM assignments WHERE id=?").get(id);
    if (!assignment) throw new HttpError(404, "Assignment not found.");
    // Teachers can only delete their own; admins can delete any
    if (req.user.role === "teacher" && assignment.created_by !== req.user.id) {
      throw new HttpError(403, "You can only delete your own assignments.");
    }

    db.prepare("DELETE FROM assignment_submissions WHERE assignment_id=?").run(id);
    db.prepare("DELETE FROM assignments WHERE id=?").run(id);
    svc.audit(req.user.name, "Deleted assignment", id);
    res.json({ ok: true });
  }));

  // ── GET /api/assignments/:id/submissions — teacher/admin views all submissions for an assignment
  app.get("/api/assignments/:id/submissions", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Access denied.");
    const { id } = req.params;
    const assignment = db.prepare("SELECT * FROM assignments WHERE id=?").get(id);
    if (!assignment) throw new HttpError(404, "Assignment not found.");

    const submissions = db.prepare(
      `SELECT s.*, u.name AS student_name
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC NULLS LAST`
    ).all(id);

    res.json({ assignment, submissions });
  }));
}

