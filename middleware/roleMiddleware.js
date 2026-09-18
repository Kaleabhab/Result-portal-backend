/**
 * Role Middleware — reusable across the whole project
 */

const sendAuthError = (res) =>
  res.status(401).json({ success: false, message: 'Authentication required' });

const sendRoleError = (res, label) =>
  res.status(403).json({ success: false, message: `${label} access only` });

// Individual guards
const superAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'super_admin') return sendRoleError(res, 'Super Admin');
  next();
};

const itAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'it_admin') return sendRoleError(res, 'IT Admin');
  next();
};

const departmentAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'department_admin') return sendRoleError(res, 'Department Admin');
  next();
};

const registrationAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'registration_admin') return sendRoleError(res, 'Registration Admin');
  next();
};

const classAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'class_admin') return sendRoleError(res, 'Class Admin');
  next();
};

const studentOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== 'student') return sendRoleError(res, 'Student');
  next();
};

// Any admin (all 5)
const anyAdminOnly = (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  const adminRoles = ['super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  next();
};

// Factory
const requireRole = (role) => (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (req.user.role !== role) {
    return res.status(403).json({ success: false, message: `Access denied. Required role: ${role}` });
  }
  next();
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return sendAuthError(res);
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required: ${roles.join(' or ')}`
    });
  }
  next();
};

module.exports = {
  superAdminOnly,
  itAdminOnly,
  departmentAdminOnly,
  registrationAdminOnly,
  classAdminOnly,
  studentOnly,
  anyAdminOnly,
  requireRole,
  requireRoles
};