export const MODULE_DEFINITIONS = {
  students: {
    key: "students",
    name: "Students",
    description: "Student profiles, admissions, enrollments, and guardian contacts",
    icon: "🎓"
  },
  staff: {
    key: "staff",
    name: "Staff",
    description: "Staff directory, designations, employee records, and teacher assignments",
    icon: "👥"
  },
  classes: {
    key: "classes",
    name: "Classes",
    description: "Classrooms, sections, room capacities, and student allocations",
    icon: "🏫"
  },
  subjects: {
    key: "subjects",
    name: "Subjects",
    description: "Academic departments, subject courses, and curriculum catalogs",
    icon: "📚"
  },
  fees: {
    key: "fees",
    name: "Fees",
    description: "Fee heads, structures, student billing accounts, invoices, and payments",
    icon: "💰"
  },
  finance: {
    key: "finance",
    name: "Finance",
    description: "Payroll, expenses, collections, and consolidated financial reporting",
    icon: "📈"
  },
  users: {
    key: "users",
    name: "Users",
    description: "Administrator accounts, password resets, roles, and permission assignments",
    icon: "🔐"
  },
  school: {
    key: "school",
    name: "School Setup",
    description: "School profile, academic years, terms, and the official academic calendar",
    icon: "🏛️"
  },
  audit: {
    key: "audit",
    name: "Audit Logs",
    description: "System audit trails, administrator action tracking, and compliance logs",
    icon: "📋"
  },
  dashboard: {
    key: "dashboard",
    name: "Reports",
    description: "Executive analytics, KPI summaries, and school operational statistics",
    icon: "📊"
  }
};

const ACTION_VERBS = {
  create: "Add",
  add: "Add",
  edit: "Edit",
  update: "Edit",
  view: "View",
  read: "View",
  delete: "Remove",
  remove: "Remove",
  approve: "Approve",
  export: "Export",
  publish: "Publish"
};

const MODULE_NOUNS = {
  students: "Students",
  student: "Students",
  staff: "Staff",
  classes: "Classes",
  class: "Classes",
  subjects: "Subjects",
  subject: "Subjects",
  fees: "Fees",
  finance: "Finance",
  fee: "Fees",
  users: "Users",
  user: "Users",
  school: "School Setup",
  audit: "Audit Logs",
  dashboard: "Reports",
  reports: "Reports",
  report: "Reports"
};

export const PERMISSION_DEFINITIONS = {
  // Students Module
  "students:view": {
    label: "View Students",
    description: "Access student profiles, admission records, and guardian contact details",
    category: "View"
  },
  "students:create": {
    label: "Add Students",
    description: "Register new students and enroll them into classes and sections",
    category: "Add"
  },
  "students:edit": {
    label: "Edit Students",
    description: "Update student details, bio, guardian information, and enrollment status",
    category: "Edit"
  },
  "students:delete": {
    label: "Remove Students",
    description: "Remove student admission profiles and student records",
    category: "Remove"
  },
  "students:approve": {
    label: "Approve Students",
    description: "Review and approve student admissions and enrollment requests",
    category: "Approve"
  },
  "students:export": {
    label: "Export Students",
    description: "Download student lists, class registers, and guardian contact sheets",
    category: "Export"
  },
  "students:publish": {
    label: "Publish Students",
    description: "Publish class rosters and official student academic records",
    category: "Publish"
  },

  // Staff Module
  "staff:view": {
    label: "View Staff",
    description: "Browse employee directory, designations, and staff profile details",
    category: "View"
  },
  "staff:create": {
    label: "Add Staff",
    description: "Onboard new teachers, administrative personnel, and staff members",
    category: "Add"
  },
  "staff:edit": {
    label: "Edit Staff",
    description: "Update staff designations, contact details, and teacher assignments",
    category: "Edit"
  },
  "staff:delete": {
    label: "Remove Staff",
    description: "Remove employee records and staff profiles from the system",
    category: "Remove"
  },
  "staff:approve": {
    label: "Approve Staff",
    description: "Approve staff onboarding, leave applications, and assignments",
    category: "Approve"
  },
  "staff:export": {
    label: "Export Staff",
    description: "Download employee lists and staff directory reports",
    category: "Export"
  },
  "staff:publish": {
    label: "Publish Staff",
    description: "Publish notices and administrative circulars to staff members",
    category: "Publish"
  },

  // Classes Module
  "classes:view": {
    label: "View Classes",
    description: "View grade levels, section rooms, and student seating capacities",
    category: "View"
  },
  "classes:create": {
    label: "Add Classes",
    description: "Create new grade levels, class sections, and define room capacities",
    category: "Add"
  },
  "classes:edit": {
    label: "Edit Classes",
    description: "Modify class names, room capacities, and section details",
    category: "Edit"
  },
  "classes:delete": {
    label: "Remove Classes",
    description: "Remove unused sections or class definitions",
    category: "Remove"
  },
  "classes:approve": {
    label: "Approve Classes",
    description: "Approve section configurations and student capacity adjustments",
    category: "Approve"
  },
  "classes:export": {
    label: "Export Classes",
    description: "Download class rosters and section distribution sheets",
    category: "Export"
  },
  "classes:publish": {
    label: "Publish Classes",
    description: "Publish finalized class schedules and student section assignments",
    category: "Publish"
  },

  // Subjects Module
  "subjects:view": {
    label: "View Subjects",
    description: "Browse academic departments and subject curriculum catalogs",
    category: "View"
  },
  "subjects:create": {
    label: "Add Subjects",
    description: "Create new academic departments and subject courses",
    category: "Add"
  },
  "subjects:edit": {
    label: "Edit Subjects",
    description: "Update subject names, course codes, and department details",
    category: "Edit"
  },
  "subjects:delete": {
    label: "Remove Subjects",
    description: "Remove inactive subject courses or obsolete departments",
    category: "Remove"
  },
  "subjects:approve": {
    label: "Approve Subjects",
    description: "Approve department curriculum plans and subject offerings",
    category: "Approve"
  },
  "subjects:export": {
    label: "Export Subjects",
    description: "Download complete subject catalogs and department lists",
    category: "Export"
  },
  "subjects:publish": {
    label: "Publish Subjects",
    description: "Publish subject catalog and course information",
    category: "Publish"
  },

  // Fees Module
  "fees:view": {
    label: "View Fees",
    description: "View fee structures, student billing accounts, and invoices",
    category: "View"
  },
  "fees:create": {
    label: "Add Fees",
    description: "Add fee categories, fee structures, and generate student invoices",
    category: "Add"
  },
  "fees:edit": {
    label: "Edit Fees",
    description: "Record fee collections, offline payments, and modify fee structures",
    category: "Edit"
  },
  "fees:delete": {
    label: "Remove Fees",
    description: "Cancel unpaid invoices and remove unassigned fee structures",
    category: "Remove"
  },
  "fees:approve": {
    label: "Approve Fees",
    description: "Approve fee concessions, discounts, and payment adjustments",
    category: "Approve"
  },
  "fees:export": {
    label: "Export Fees",
    description: "Download fee collection summaries, aging reports, and receipts",
    category: "Export"
  },
  "fees:publish": {
    label: "Publish Fees",
    description: "Publish fee circulars and due date announcements",
    category: "Publish"
  },

  // Users Module
  "users:view": {
    label: "View Users",
    description: "Inspect administrator user accounts, active sessions, and roles",
    category: "View"
  },
  "users:create": {
    label: "Add Users",
    description: "Create new portal administrator accounts and user profiles",
    category: "Add"
  },
  "users:edit": {
    label: "Edit Users",
    description: "Assign user roles, reset accounts, and edit role permissions",
    category: "Edit"
  },
  "users:delete": {
    label: "Remove Users",
    description: "Remove user logins and custom role definitions",
    category: "Remove"
  },
  "users:approve": {
    label: "Approve Users",
    description: "Approve privilege elevation requests and new user access",
    category: "Approve"
  },
  "users:export": {
    label: "Export Users",
    description: "Download list of system users and their assigned roles",
    category: "Export"
  },
  "users:publish": {
    label: "Publish Users",
    description: "Broadcast login and security policy updates",
    category: "Publish"
  },

  // School Setup Module
  "school:view": {
    label: "View School Setup",
    description: "View school profile, campuses, academic years, and academic calendar",
    category: "View"
  },
  "school:create": {
    label: "Add School Setup",
    description: "Create new academic years, terms, and calendar events",
    category: "Add"
  },
  "school:edit": {
    label: "Edit School Setup",
    description: "Update school profile, set current academic year, edit terms and events",
    category: "Edit"
  },
  "school:delete": {
    label: "Remove School Setup",
    description: "Remove obsolete calendar events and academic terms",
    category: "Remove"
  },
  "school:approve": {
    label: "Approve School Setup",
    description: "Approve official annual school calendar schedules",
    category: "Approve"
  },
  "school:export": {
    label: "Export School Setup",
    description: "Download school calendar schedules and event lists",
    category: "Export"
  },
  "school:publish": {
    label: "Publish School Setup",
    description: "Publish official school calendar to all users",
    category: "Publish"
  },

  // Audit Logs Module
  "audit:view": {
    label: "View Audit Logs",
    description: "Inspect system activity logs, administrator actions, and security history",
    category: "View"
  },
  "audit:create": {
    label: "Add Audit Notes",
    description: "Attach administrative notes to audit log entries",
    category: "Add"
  },
  "audit:edit": {
    label: "Edit Audit Logs",
    description: "Configure audit log tracking policies and settings",
    category: "Edit"
  },
  "audit:delete": {
    label: "Remove Audit Logs",
    description: "Archive or purge old audit log records",
    category: "Remove"
  },
  "audit:approve": {
    label: "Approve Audit Logs",
    description: "Sign off on compliance audits and system review logs",
    category: "Approve"
  },
  "audit:export": {
    label: "Export Audit Logs",
    description: "Download system audit trail and compliance reports",
    category: "Export"
  },
  "audit:publish": {
    label: "Publish Audit Logs",
    description: "Publish audit summaries to school management",
    category: "Publish"
  },

  // Reports Module
  "dashboard:view": {
    label: "View Reports",
    description: "Access executive dashboard, KPI summaries, and operational statistics",
    category: "View"
  },
  "dashboard:create": {
    label: "Add Reports",
    description: "Build custom reports and personalized metric summaries",
    category: "Add"
  },
  "dashboard:edit": {
    label: "Edit Reports",
    description: "Configure dashboard cards, shortcuts, and default summary views",
    category: "Edit"
  },
  "dashboard:delete": {
    label: "Remove Reports",
    description: "Remove saved custom report configurations",
    category: "Remove"
  },
  "dashboard:approve": {
    label: "Approve Reports",
    description: "Sign off on periodic executive and operational summaries",
    category: "Approve"
  },
  "dashboard:export": {
    label: "Export Reports",
    description: "Download executive reports, analytics, and KPI data",
    category: "Export"
  },
  "dashboard:publish": {
    label: "Publish Reports",
    description: "Broadcast school-wide dashboard notices",
    category: "Publish"
  }
};

/**
 * Returns a simple, consistent, human-readable label for any permission key.
 * Handles patterns such as:
 * - (moduleName: "students", actionName: "create") -> "Add Students"
 * - (moduleName: "students", actionName: "delete") -> "Remove Students"
 * - (moduleName: "view.student") -> "View Students"
 * - (moduleName: "delete.staff") -> "Remove Staff"
 * - (moduleName: "add.classes") -> "Add Classes"
 * - (moduleName: "edit.fees") -> "Edit Fees"
 */
export function getPermissionLabel(moduleName, actionName) {
  const directKey = `${moduleName}:${actionName}`;
  if (PERMISSION_DEFINITIONS[directKey]?.label) {
    return PERMISSION_DEFINITIONS[directKey].label;
  }

  // Handle dot notation (e.g. "add.student", "delete.staff", "view.classes")
  if (typeof moduleName === "string" && moduleName.includes(".")) {
    const parts = moduleName.split(".");
    const act = parts[0].toLowerCase();
    const mod = parts[1].toLowerCase();
    const verb = ACTION_VERBS[act] || (act.charAt(0).toUpperCase() + act.slice(1));
    const noun = MODULE_NOUNS[mod] || (mod.charAt(0).toUpperCase() + mod.slice(1));
    return `${verb} ${noun}`;
  }

  // Handle inverted action/module names
  const modLower = (moduleName || "").toLowerCase();
  const actLower = (actionName || "").toLowerCase();

  if (ACTION_VERBS[modLower] && MODULE_NOUNS[actLower]) {
    return `${ACTION_VERBS[modLower]} ${MODULE_NOUNS[actLower]}`;
  }

  const verb = ACTION_VERBS[actLower] || (actLower.charAt(0).toUpperCase() + actLower.slice(1));
  const noun = MODULE_NOUNS[modLower] || (modLower.charAt(0).toUpperCase() + modLower.slice(1));
  return `${verb} ${noun}`;
}

/**
 * Returns a short, user-friendly description for a permission.
 */
export function getPermissionDescription(moduleName, actionName, rawDescription) {
  const directKey = `${moduleName}:${actionName}`;
  if (PERMISSION_DEFINITIONS[directKey]?.description) {
    return PERMISSION_DEFINITIONS[directKey].description;
  }
  if (rawDescription && rawDescription !== `${moduleName} ${actionName}` && !rawDescription.includes(".")) {
    return rawDescription;
  }
  const label = getPermissionLabel(moduleName, actionName);
  return `Allows administrator to ${label.toLowerCase()} in the system.`;
}

/**
 * Returns module display info.
 */
export function getModuleInfo(moduleName) {
  if (MODULE_DEFINITIONS[moduleName]) {
    return MODULE_DEFINITIONS[moduleName];
  }
  const capitalized = (moduleName || "").charAt(0).toUpperCase() + (moduleName || "").slice(1);
  return {
    key: moduleName,
    name: capitalized,
    description: `Permissions for ${capitalized} management`,
    icon: "⚙️"
  };
}
