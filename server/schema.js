// Table definitions. They mirror the columns used by the website so rows round-trip unchanged.
export const PERMS = ["attendance", "students", "finance", "reports", "timetable", "announcements", "assessments", "website"];
export const ROLES = ["admin", "teacher", "accounts", "student", "parent"];
export const ONLINE_METHODS = ["UPI (online)", "Card (online)", "Net banking (online)"];
const ALL_METHODS = [...ONLINE_METHODS, "Cash", "Cheque", "Bank transfer"];
const STUDENT_STATUS = ["Active", "Pending", "Suspended", "Inactive"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const IMG = 1_600_000; // max characters for an embedded image (data URL)

const T = (label, ncols, key, o = {}) => ({ label, ncols, key, mode: "diff", idp: false, perm: null, selects: {}, images: [], ...o });

export const TABLES = {
  students: T("student", 7, [0], { idp: true, perm: "students", selects: { 6: STUDENT_STATUS } }),
  admissions: T("enquiry", 8, [0], { idp: true, perm: "students", selects: { 6: ["Pending", "Review", "Approved", "Rejected"] } }),
  guardians: T("guardian", 3, [0], { perm: "students" }),
  teachers: T("teacher", 5, [0], { idp: true, perm: "students", selects: { 4: ["Active", "Inactive"] } }),
  batches: T("batch", 6, [0], { idp: true, perm: "students", selects: { 5: ["Active", "Inactive"] } }),
  tt: T("class slot", 5, [0, 1, 2], { perm: "timetable", selects: { 0: DAYS } }),
  attendance: T("attendance record", 6, [0, 1, 2], { perm: "attendance", selects: { 4: ["Present", "Late", "Absent", "Leave"] } }),
  invoices: T("invoice", 7, [0], { idp: true, perm: "finance", selects: { 6: ["Pending", "Partial", "Paid", "Overdue"] } }),
  payments: T("payment", 7, [0], { idp: true, perm: "finance", selects: { 3: ALL_METHODS, 6: ["Verified", "Pending", "Failed"] } }),
  receipts: T("receipt", 6, [0], { idp: true, perm: "finance", selects: { 5: ["Issued", "Void"] } }),
  refunds: T("refund", 5, [0], { idp: true, perm: "finance", selects: { 4: ["Pending", "Approved", "Rejected"] } }),
  leave: T("leave request", 5, [0], { idp: true, perm: "attendance", selects: { 4: ["Pending", "Approved", "Rejected"] } }),
  assessments: T("assessment", 6, [0, 1, 4, 5], {
    perm: "assessments",
    selects: { 1: ["Adavus", "Mudras", "Abhinaya", "Rhythm", "Posture", "Other"], 2: [1, 2, 3, 4, 5].map((i) => `${i} / 5`) },
  }),
  announcements: T("announcement", 6, [0], { idp: true, perm: "announcements", selects: { 5: ["Draft", "Published"] } }),
  notifications: T("notification", 5, [0], { idp: true, perm: "announcements", selects: { 4: ["Queued", "Delivered", "Failed"] } }),
  users: T("account", 7, [0], { idp: true, selects: { 2: ROLES, 4: ["Active", "Suspended"] } }),
  audit: T("audit entry", 4, [0]),
  // ordered website content: replaced as a whole, guarded by a version number
  courses: T("programme", 7, [0], { mode: "replace", perm: "website", images: [6], selects: { 1: ["Regular classes", "Workshops", "Performance", "Exams", "Other"] } }),
  gurus: T("guru", 4, [0], { mode: "replace", perm: "website", images: [3] }),
  gallery: T("photo", 3, [0], { mode: "replace", perm: "website", images: [2] }),
  events: T("event", 6, [0], { mode: "replace", perm: "website", images: [5], selects: { 4: ["Upcoming", "Past", "Draft"] } }),
  highlights: T("highlight", 4, [0], { mode: "replace", perm: "website", images: [3] }),
};

export const PUBLIC_TABLES = ["courses", "gurus", "gallery", "events", "highlights"];
export const SITE_KEYS = ["name", "tag", "city", "phone", "email", "address", "hours", "heroTitle", "heroSub", "heroImg",
  "welcomeH", "welcome", "story", "philosophy", "c1", "c2", "c3"];
export const SETTINGS_KEYS = ["dueDay", "lateFee", "lateMins"];
export const SITE_IMAGE_KEYS = ["heroImg"];

export const schemaJson = () =>
  Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [k, { mode: v.mode, key: v.key, ncols: v.ncols, idp: v.idp }]));
