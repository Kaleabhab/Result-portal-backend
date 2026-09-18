/**
 * Admin Management Configuration
 * Hierarchy, scope rules, audit constants
 */

// ============================================================
// ROLE HIERARCHY — who can create whom
// ============================================================
const ROLE_HIERARCHY = {
  super_admin: ['it_admin'],
  it_admin: ['department_admin', 'registration_admin'],
  department_admin: ['class_admin'],
  registration_admin: [],   // manages students (Student Mgmt)
  class_admin: [],          // no account management
  student: []
};

// ============================================================
// ROLE SCOPE RULES
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
// ADMIN ROLES
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
  // Auth
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Admin lifecycle
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_ACTIVATED: 'ADMIN_ACTIVATED',
  ADMIN_DEACTIVATED: 'ADMIN_DEACTIVATED',
  ADMIN_PASSWORD_RESET: 'ADMIN_PASSWORD_RESET',
  ADMIN_CREATE_DENIED: 'ADMIN_CREATE_DENIED',
  ADMIN_PERMISSIONS_UPDATED: 'ADMIN_PERMISSIONS_UPDATED',
  ADMIN_SCOPE_UPDATED: 'ADMIN_SCOPE_UPDATED',

  // IT System
  SYSTEM_CONFIGURATION: 'SYSTEM_CONFIGURATION',
  SERVER_APPLICATION_CONFIGURATION: 'SERVER_APPLICATION_CONFIGURATION',
  DATABASE_MAINTENANCE: 'DATABASE_MAINTENANCE',
  AUTHENTICATION_INFRASTRUCTURE: 'AUTHENTICATION_INFRASTRUCTURE',
  SECURITY_CONFIGURATION: 'SECURITY_CONFIGURATION',
  BACKUP_RECOVERY: 'BACKUP_RECOVERY',
  TECHNICAL_MONITORING: 'TECHNICAL_MONITORING',
  SYSTEM_HEALTH: 'SYSTEM_HEALTH',
  INTEGRATION_CONFIGURATION: 'INTEGRATION_CONFIGURATION',
  EMAIL_SYSTEM_CONFIGURATION: 'EMAIL_SYSTEM_CONFIGURATION',
  TECHNICAL_ACCESS_CONFIGURATION: 'TECHNICAL_ACCESS_CONFIGURATION',

  // Audit
  AUDIT_LOG_VIEWED: 'AUDIT_LOG_VIEWED',
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED'
};

// ============================================================
// PAGINATION
// ============================================================
const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 50,
  maxLimit: 200
};

module.exports = {
  ROLE_HIERARCHY,
  ROLE_SCOPE_RULES,
  ADMIN_ROLES,
  AUDIT_ACTIONS,
  PAGINATION
};