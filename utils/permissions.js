/**
 * Master Permission Map
 * Every role → every action it can perform.
 * Admin Management uses this now.
 * Student / Academic / Result modules will use this later.
 */

const PERMISSIONS = {

  // ============================================================
  // SUPER ADMIN — global governance
  // ============================================================
  super_admin: [
    // Admin Management
    'manage_it_admin',
    'manage_department_admin',
    'manage_registration_admin',
    'manage_class_admin',
    'view_all_admins',
    'manage_admin_permissions',
    'manage_admin_scope',
    'manage_audit_logs',
    'global_oversight',

    // Top-level academic structure
    'create_college',
    'manage_college',
    'create_department',
    'manage_department',
    'manage_academic_structure',

    // Student lifecycle (override)
    'register_student',
    'bulk_register_student',
    'manage_student',
    'view_students',
    'withdraw_student',
    'reactivate_student',
    'transfer_student',

    // Results (override)
    'manage_results',
    'release_results',

    // System
    'system_configuration',
    'database_maintenance',
    'backup_recovery',
    'technical_monitoring'
  ],

  // ============================================================
  // IT ADMIN — technical + account management
  // ============================================================
  it_admin: [
    // Account management (its scope)
    'manage_department_admin',
    'manage_registration_admin',

    // Technical system
    'system_configuration',
    'server_application_configuration',
    'database_maintenance',
    'authentication_infrastructure',
    'security_configuration',
    'backup_recovery',
    'technical_monitoring',
    'system_health',
    'integration_configuration',
    'email_system_configuration',
    'technical_access_configuration'
  ],

  // ============================================================
  // DEPARTMENT ADMIN — department academic + class admins
  // ============================================================
  department_admin: [
    // Account management
    'manage_class_admin',

    // Academic structure (within own department)
    'manage_academic_level',
    'manage_class',
    'manage_academic_period',
    'manage_module',
    'manage_subject',
    'manage_cohort',

    // View (department scope)
    'view_department_students',
    'view_department_results'
  ],

  // ============================================================
  // REGISTRATION ADMIN — student lifecycle
  // ============================================================
  registration_admin: [
    'register_student',
    'bulk_register_student',
    'manage_student',
    'view_students',
    'withdraw_student',
    'reactivate_student',
    'transfer_student'
  ],

  // ============================================================
  // CLASS ADMIN — assigned class only
  // ============================================================
  class_admin: [
    'view_class_students',
    'view_class_results',
    'upload_class_results',
    'manage_class_attendance',

    'manage_results',
    'release_results',
  ],

  // ============================================================
  // STUDENT — own data only
  // ============================================================
  student: [
    'view_own_profile',
    'update_own_profile',
    'view_own_results'
  ]
};

// ============================================================
// Helpers
// ============================================================
const getPermissionsForRole = (role) => PERMISSIONS[role] || [];

const roleHasPermission = (role, permission) =>
  getPermissionsForRole(role).includes(permission);

const roleHasAnyPermission = (role, permissions) =>
  permissions.some((p) => roleHasPermission(role, p));

const getRolesWithPermission = (permission) =>
  Object.keys(PERMISSIONS).filter((role) => roleHasPermission(role, permission));

module.exports = {
  PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
  roleHasAnyPermission,
  getRolesWithPermission
};