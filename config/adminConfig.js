/**
 * Admin Management Configuration
 * Central place for hierarchy, scope rules, and audit action constants
 */

// ============================================================
// ROLE HIERARCHY — who can create whom
// ============================================================
const ROLE_HIERARCHY = {
  super_admin: ['it_admin'],
  it_admin: ['department_admin', 'registration_admin'],
  department_admin: ['class_admin'],
  registration_admin: ['student'],
  class_admin: [],
  student: []
};

// ============================================================
// ROLE SCOPE RULES — which scope fields each role requires
// ============================================================
const ROLE_SCOPE_RULES = {
  super_admin: [],
  it_admin: [],
  department_admin: ['departmentId'],
  registration_admin: ['collegeId'],
  class_admin: ['classId'],
  student: ['studentId']
};

// ============================================================
// ROLE SCOPE EXTRACTION — how to derive full scope for a target
// (e.g. class_admin needs department + college auto-derived from class)
// ============================================================
const SCOPE_DERIVATION = {
  super_admin: false,
  it_admin: false,
  department_admin: false,
  registration_admin: false,
  class_admin: true,   // auto-derive academicLevelId, departmentId, collegeId from classId
  student: false
};

// ============================================================
// ADMIN ROLE LIST
// ============================================================
const ADMIN_ROLES = [
  'super_admin',
  'it_admin',
  'department_admin',
  'registration_admin',
  'class_admin'
];

// ============================================================
// AUDIT ACTION CONSTANTS
// ============================================================
const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Admin account lifecycle
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_ACTIVATED: 'ADMIN_ACTIVATED',
  ADMIN_DEACTIVATED: 'ADMIN_DEACTIVATED',
  ADMIN_PASSWORD_RESET: 'ADMIN_PASSWORD_RESET',
  ADMIN_CREATE_DENIED: 'ADMIN_CREATE_DENIED',
  ADMIN_PERMISSIONS_UPDATED: 'ADMIN_PERMISSIONS_UPDATED',
  ADMIN_SCOPE_UPDATED: 'ADMIN_SCOPE_UPDATED',

  // System / IT operations
  SYSTEM_CONFIGURATION: 'SYSTEM_CONFIGURATION',
  DATABASE_MAINTENANCE: 'DATABASE_MAINTENANCE',
  BACKUP_RECOVERY: 'BACKUP_RECOVERY',
  TECHNICAL_MONITORING: 'TECHNICAL_MONITORING',

  // Audit access
  AUDIT_LOG_VIEWED: 'AUDIT_LOG_VIEWED',
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED'
};

// ============================================================
// TEMP PASSWORD RULES
// ============================================================
const TEMP_PASSWORD_RULES = {
  includeFirstInitial: true,
  includeLastInitial: true,
  includeRandomNumber: true,
  randomNumberDigits: 4,
  appendSymbol: '!'
};

// ============================================================
// PAGINATION DEFAULTS
// ============================================================
const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 50,
  maxLimit: 200
};

module.exports = {
  ROLE_HIERARCHY,
  ROLE_SCOPE_RULES,
  SCOPE_DERIVATION,
  ADMIN_ROLES,
  AUDIT_ACTIONS,
  TEMP_PASSWORD_RULES,
  PAGINATION
};