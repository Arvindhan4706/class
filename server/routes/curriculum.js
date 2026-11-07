// server/routes/curriculum.js
// Bharatanatyam curriculum tracking routes — Phase 3
import { db } from "../db.js";
import { HttpError } from "../service.js";
import * as svc from "../service.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const isAdmin = (u) => u.role === "admin";
const isTeacher = (u) => u.role === "teacher";
const canManage = (u) => isAdmin(u) || isTeacher(u);

export function curriculumRoutes(app, auth) {

  // ── GET /api/curriculum
  // Returns the full curriculum structure, optionally filtered by level
  app.get("/api/curriculum", auth, wrap(async (req, res) => {
    const level = req.query.level; // optional: Foundation | Intermediate | Advanced
    const rows = level
      ? db.prepare("SELECT * FROM curriculum WHERE level=? ORDER BY sort_order").all(level)
      : db.prepare("SELECT * FROM curriculum ORDER BY level, sort_order").all();

    // Group by level → category
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.level]) grouped[row.level] = {};
      if (!grouped[row.level][row.category]) grouped[row.level][row.category] = [];
      grouped[row.level][row.category].push(row);
    }
    res.json({ curriculum: rows, grouped });
  }));

  // ── GET /api/curriculum/student/:studentId
  // Returns a student's progress against the full curriculum
  app.get("/api/curriculum/student/:studentId", auth, wrap(async (req, res) => {
    const { studentId } = req.params;
    const u = req.user;
    // Students see own; parents/teachers/admins see any
    if (u.role === "student" && u.id !== studentId) throw new HttpError(403, "Access denied.");
    if (u.role === "parent") {
      const linked = db.prepare("SELECT student_id FROM guardians WHERE email=?").all(u.email || "");
      if (!linked.some((r) => r.student_id === studentId)) throw new HttpError(403, "Access denied.");
    }

    const curriculum = db.prepare("SELECT * FROM curriculum ORDER BY sort_order").all();
    const progress = db.prepare(
      "SELECT * FROM student_progress WHERE student_id=?"
    ).all(studentId);

    const progressMap = Object.fromEntries(progress.map((p) => [p.curriculum_id, p]));

    const result = curriculum.map((item) => ({
      ...item,
      progress: progressMap[item.id] || { status: "not_started", guru_note: "", assessed_by: null, assessed_at: null },
    }));

    // Summary stats
    const total = result.length;
    const completed = result.filter((r) => r.progress.status === "completed").length;
    const inProgress = result.filter((r) => r.progress.status === "in_progress").length;
    const notStarted = total - completed - inProgress;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ studentId, items: result, summary: { total, completed, inProgress, notStarted, pct } });
  }));

  // ── PATCH /api/curriculum/student/:studentId/:curriculumId
  // Teacher/admin updates a student's progress on one curriculum item
  app.patch("/api/curriculum/student/:studentId/:curriculumId", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Only teachers and admins can update progress.");
    const { studentId, curriculumId } = req.params;
    const b = req.body;

    const validStatuses = ["not_started", "in_progress", "completed"];
    const status = typeof b?.status === "string" ? b.status : null;
    if (status && !validStatuses.includes(status)) {
      throw new HttpError(422, `status must be one of: ${validStatuses.join(", ")}`);
    }
    const guruNote = typeof b?.guru_note === "string" ? b.guru_note.slice(0, 1000) : null;

    // Upsert
    const existing = db.prepare(
      "SELECT id FROM student_progress WHERE student_id=? AND curriculum_id=?"
    ).get(studentId, curriculumId);

    if (existing) {
      const updates = [];
      const vals = [];
      if (status) { updates.push("status=?"); vals.push(status); }
      if (guruNote !== null) { updates.push("guru_note=?"); vals.push(guruNote); }
      updates.push("assessed_by=?", "assessed_at=datetime('now')");
      vals.push(req.user.id, studentId, curriculumId);
      db.prepare(
        `UPDATE student_progress SET ${updates.join(", ")} WHERE student_id=? AND curriculum_id=?`
      ).run(...vals);
    } else {
      db.prepare(
        `INSERT INTO student_progress (student_id, curriculum_id, status, guru_note, assessed_by, assessed_at)
         VALUES (?,?,?,?,?,datetime('now'))`
      ).run(studentId, curriculumId, status || "not_started", guruNote || "", req.user.id);
    }

    svc.audit(req.user.name, `Updated curriculum progress: ${status}`, `${studentId}/${curriculumId}`);
    res.json({ ok: true });
  }));

  // ── GET /api/curriculum/batch/:batchId
  // Returns aggregated progress for all students in a batch
  app.get("/api/curriculum/batch/:batchId", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Access denied.");
    const { batchId } = req.params;

    // Get all students in the batch from batch_members or records
    // Try batch_members first (Phase 1 schema), fall back to searching records
    let studentIds = db.prepare(
      "SELECT student_id FROM batch_members WHERE batch_id=?"
    ).all(batchId).map((r) => r.student_id);

    if (studentIds.length === 0) {
      // Fallback: parse student list from the records table batch data
      const batchRow = db.prepare("SELECT data FROM records WHERE tbl='batches' AND key=?").get(batchId);
      if (!batchRow) throw new HttpError(404, "Batch not found.");
      const data = JSON.parse(batchRow.data);
      studentIds = Array.isArray(data) ? data.filter((d) => typeof d === "string" && d.startsWith("STU-")) : [];
    }

    const curriculum = db.prepare("SELECT * FROM curriculum ORDER BY sort_order").all();
    const result = [];

    for (const sid of studentIds) {
      const student = db.prepare("SELECT id, name FROM users WHERE id=?").get(sid);
      const progress = db.prepare("SELECT * FROM student_progress WHERE student_id=?").all(sid);
      const progressMap = Object.fromEntries(progress.map((p) => [p.curriculum_id, p]));
      const completed = curriculum.filter((c) => progressMap[c.id]?.status === "completed").length;
      result.push({
        studentId: sid,
        name: student?.name || sid,
        completed,
        total: curriculum.length,
        pct: Math.round((completed / (curriculum.length || 1)) * 100),
      });
    }

    res.json({ batchId, students: result });
  }));

  // ── GET /api/arangetram
  // Returns all arangetram tracking records (admin/teacher)
  app.get("/api/arangetram", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Access denied.");
    const rows = db.prepare(
      `SELECT a.*, u.name AS student_name
       FROM arangetram_tracker a
       JOIN users u ON u.id = a.student_id
       ORDER BY u.name`
    ).all();
    res.json({ arangetram: rows });
  }));

  // ── GET /api/arangetram/:studentId — student sees own record
  app.get("/api/arangetram/:studentId", auth, wrap(async (req, res) => {
    const { studentId } = req.params;
    if (req.user.role === "student" && req.user.id !== studentId) throw new HttpError(403, "Access denied.");
    const row = db.prepare("SELECT * FROM arangetram_tracker WHERE student_id=?").get(studentId);
    res.json({ arangetram: row || { student_id: studentId, eligible: 0, repertoire_complete: 0, guru_clearance: 0 } });
  }));

  // ── PATCH /api/arangetram/:studentId — admin/teacher updates arangetram status
  app.patch("/api/arangetram/:studentId", auth, wrap(async (req, res) => {
    if (!canManage(req.user)) throw new HttpError(403, "Only teachers and admins can update arangetram records.");
    const { studentId } = req.params;
    const b = req.body;

    const existing = db.prepare("SELECT student_id FROM arangetram_tracker WHERE student_id=?").get(studentId);
    if (existing) {
      const updates = [];
      const vals = [];
      if (b.eligible !== undefined) { updates.push("eligible=?"); vals.push(b.eligible ? 1 : 0); }
      if (b.estimated_date !== undefined) { updates.push("estimated_date=?"); vals.push(b.estimated_date); }
      if (b.repertoire_complete !== undefined) { updates.push("repertoire_complete=?"); vals.push(b.repertoire_complete ? 1 : 0); }
      if (b.guru_clearance !== undefined) { updates.push("guru_clearance=?"); vals.push(b.guru_clearance ? 1 : 0); }
      if (b.notes !== undefined) { updates.push("notes=?"); vals.push(String(b.notes).slice(0, 2000)); }
      if (updates.length === 0) return res.json({ ok: true });
      vals.push(studentId);
      db.prepare(`UPDATE arangetram_tracker SET ${updates.join(", ")} WHERE student_id=?`).run(...vals);
    } else {
      db.prepare(
        `INSERT INTO arangetram_tracker (student_id, eligible, estimated_date, repertoire_complete, guru_clearance, notes)
         VALUES (?,?,?,?,?,?)`
      ).run(
        studentId,
        b.eligible ? 1 : 0,
        b.estimated_date || null,
        b.repertoire_complete ? 1 : 0,
        b.guru_clearance ? 1 : 0,
        String(b.notes || "").slice(0, 2000)
      );
    }

    svc.audit(req.user.name, "Updated arangetram record", studentId);
    res.json({ ok: true });
  }));

  // ── POST /api/curriculum/items — admin adds a new curriculum item
  app.post("/api/curriculum/items", auth, wrap(async (req, res) => {
    if (!isAdmin(req.user)) throw new HttpError(403, "Only admins can add curriculum items.");
    const b = req.body;
    const id = typeof b?.id === "string" ? b.id.trim() : `CUR-${Date.now()}`;
    const level = typeof b?.level === "string" ? b.level.trim() : "";
    const category = typeof b?.category === "string" ? b.category.trim() : "";
    const item = typeof b?.item === "string" ? b.item.trim() : "";
    if (!level || !category || !item) throw new HttpError(422, "level, category and item are required.");

    db.prepare(
      "INSERT INTO curriculum (id, level, category, item, description, sort_order) VALUES (?,?,?,?,?,?)"
    ).run(id, level, category, item, b.description || "", b.sort_order || 0);

    svc.audit(req.user.name, "Added curriculum item", id);
    res.status(201).json({ ok: true, id });
  }));
}
