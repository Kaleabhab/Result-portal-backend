/**
 * Permissions utility
 * Maps role → permission list, and provides helpers
 */

const PERMISSIONS = {
  super_admin: [
    'manage_it_admin',
    'manage_audit_logs',
    'view_all_admins',
    'manage_admin_permissions',
    'manage_admin_scope',
    'global_oversight'
  ],

  it_admin: [
    'manage_department_admin',
    'manage_registration_admin',
    'system_configuration',
    'database_maintenance',
    'backup_recovery',
    'technical_monitoring',
    'system_health',
    'integration_configuration',
    'email_system_configuration',
    'technical_access_configuration',
    'authentication_infrastructure',
    'security_configuration',
    'server_application_configuration'
  ],

  department_admin: [
    'manage_class_admin'
  ],

  registration_admin: [],

  class_admin: [],

  student: []
};

// ============================================================
// Get all permissions for a role
// ============================================================
const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || [];
};

// ============================================================
// Check if a role has a permission
// ============================================================
const roleHasPermission = (role, permission) => {
  return getPermissionsForRole(role).includes(permission);
};

// ============================================================
// Check if a role has any of the given permissions
// ============================================================
const roleHasAnyPermission = (role, permissions) => {
  return permissions.some((p) => roleHasPermission(role, p));
};

// ============================================================
// Get all roles that have a permission
// ============================================================
const getRolesWithPermission = (permission) => {
  return Object.keys(PERMISSIONS).filter((role) =>
    roleHasPermission(role, permission)
  );
};

module.exports = {
  PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
  roleHasAnyPermission,
  getRolesWithPermission
};