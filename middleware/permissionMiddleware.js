/**
 * Permission Middleware
 * Checks if the authenticated user's role has the required permission
 * 
 * Permission map: role → [allowed permissions]
 */

// ============================================================
// PERMISSION MAP
// ============================================================
const PERMISSIONS = {
  super_admin: [
    // Global governance
    'manage_it_admin',
    'manage_audit_logs',
    'global_oversight',
    // Can do everything below (inherited)
    'create_college',
    'manage_college',
    'create_department',
    'manage_department',
    'manage_department_admin',
    'manage_registration_admin',
    'manage_class_admin',
    'manage_academic_structure',
    'register_student',
    'bulk_register_student',
    'manage_student',
    'manage_results',
    'release_results'
  ],

  it_admin: [
    // Technical
    'system_configuration',
    'database_maintenance',
    'technical_monitoring',
    // Account management
    'manage_department_admin',
    'manage_registration_admin'
  ],

  department_admin: [
    // Academic structure within own department
    'manage_academic_level',
    'manage_class',
    'manage_academic_period',
    'manage_module',
    'manage_subject',
    'manage_cohort',
    // Account management
    'manage_class_admin',
    // View
    'view_department_students',
    'view_department_results'
  ],

  registration_admin: [
    // Student lifecycle
    'register_student',
    'bulk_register_student',
    'manage_student',
    'withdraw_student',
    'reactivate_student',
    'transfer_student',
    'view_students'
  ],

  class_admin: [
    // Class operations
    'view_class_students',
    'view_class_results',
    'upload_class_results',
    'manage_class_attendance'
  ],

  student: [
    'view_own_profile',
    'update_own_profile',
    'view_own_results'
  ]
};

// ============================================================
// Get permissions for a role
// ============================================================
const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || [];
};

// ============================================================
// Check if a role has a specific permission
// ============================================================
const roleHasPermission = (role, permission) => {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission);
};

// ============================================================
// requirePermission — Middleware
// ============================================================
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roleHasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${permission}`
      });
    }

    next();
  };
};

// ============================================================
// requireAnyPermission — Middleware (any of the given permissions)
// ============================================================
const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasAny = permissions.some((p) =>
      roleHasPermission(req.user.role, p)
    );

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
  requirePermission,
  requireAnyPermission
};