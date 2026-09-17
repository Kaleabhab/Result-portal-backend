
/**
 * Role Middleware
 * Checks if the authenticated user has the required role
 */

// ============================================================
// requireRole — Single role check
// ============================================================
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${role}`
      });
    }

    next();
  };
};

// ============================================================
// requireRoles — Multiple role check (any of them)
// ============================================================
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required one of: ${roles.join(', ')}`
      });
    }

    next();
  };
};
// ============================================================
// Convenience middleware
// ============================================================

const adminOnly = requireRoles(
  'super_admin',
  'it_admin',
  'department_admin',
  'registration_admin',
  'class_admin'
);

const studentOnly = requireRole('student');

const superAdminOnly = requireRole('super_admin');
const itAdminOnly = requireRole('it_admin');

const departmentAdminOnly = requireRole('department_admin');

const registrationAdminOnly = requireRole('registration_admin');

const classAdminOnly = requireRole('class_admin');



// ============================================================
// Allow admin OR the specific student (owner check happens later)
// ============================================================
const adminOrStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role === 'student' || req.user.isAdmin()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
};

module.exports = {
  requireRole,
  requireRoles,
  adminOnly,
  studentOnly,
  superAdminOnly,
  itAdminOnly,
  departmentAdminOnly,
  registrationAdminOnly,
  classAdminOnly,
  adminOrStudent
};