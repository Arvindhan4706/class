-- Phase 1: Extended user profile fields
ALTER TABLE users ADD COLUMN dob TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN photo_url TEXT;
ALTER TABLE users ADD COLUMN emergency_note TEXT;

-- Guardian → Student relationships (many-to-many)
CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Guardian',
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  is_primary INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Batch membership with IDs (normalized)
CREATE TABLE IF NOT EXISTS batch_members (
  batch_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  joined_date TEXT NOT NULL,
  PRIMARY KEY (batch_id, student_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- QR attendance scans
CREATE TABLE IF NOT EXISTS attendance_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  scan_date TEXT NOT NULL,
  scan_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  marked_by TEXT NOT NULL,
  correction_requested INTEGER DEFAULT 0,
  correction_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(batch_id, student_id, scan_date)
);
CREATE INDEX IF NOT EXISTS ix_scan_batch_date ON attendance_scans (batch_id, scan_date);
CREATE INDEX IF NOT EXISTS ix_scan_student ON attendance_scans (student_id, scan_date);

-- Razorpay payment orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  invoice_key TEXT NOT NULL,
  student_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT
);

-- Curriculum structure
CREATE TABLE IF NOT EXISTS curriculum (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- Student curriculum progress
CREATE TABLE IF NOT EXISTS student_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  curriculum_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  guru_note TEXT DEFAULT '',
  assessed_by TEXT,
  assessed_at TEXT,
  UNIQUE(student_id, curriculum_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Arangetram tracking
CREATE TABLE IF NOT EXISTS arangetram_tracker (
  student_id TEXT PRIMARY KEY,
  eligible INTEGER DEFAULT 0,
  estimated_date TEXT,
  repertoire_complete INTEGER DEFAULT 0,
  guru_clearance INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Practice assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  batch_id TEXT,
  student_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT DEFAULT '',
  submitted_at TEXT,
  PRIMARY KEY (assignment_id, student_id)
);

-- Staff salaries
CREATE TABLE IF NOT EXISTS staff_salaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL,
  month TEXT NOT NULL,
  base_amount INTEGER NOT NULL,
  deductions INTEGER DEFAULT 0,
  paid_amount INTEGER,
  paid_on TEXT,
  method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  UNIQUE(teacher_id, month)
);

-- Expense tracking
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  receipt_url TEXT DEFAULT '',
  added_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

