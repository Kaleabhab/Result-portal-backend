/**
 * Scope Middleware — reusable across the whole project
 *
 * Scope semantics:
 *   super_admin       → global
 *   it_admin          → global for account management
 *   department_admin  → departmentId
 *   registration_admin→ collegeId
 *   class_admin       → classId
 *   student           → studentId
 */

const idsEqual = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

const isWithinScope = (user, target) => {
  if (!user) return false;

  switch (user.role) {
    case 'super_admin':
    case 'it_admin':
      return true;
    case 'department_admin':
      return idsEqual(user.departmentId, target.departmentId);
    case 'registration_admin':
      return idsEqual(user.collegeId, target.collegeId);
    case 'class_admin':
      return idsEqual(user.classId, target.classId);
    case 'student':
      return idsEqual(user.studentId, target.studentId);
    default:
      return false;
  }
};

const requireScope = (field) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (['super_admin', 'it_admin'].includes(req.user.role)) return next();

    const value =
      req.body?.[field] ||
      req.params?.[field] ||
      req.query?.[field];

    if (!value) {
      return res.status(400).json({ success: false, message: `${field} is required for scope validation` });
    }
    if (!isWithinScope(req.user, { [field]: value })) {
      return res.status(403).json({ success: false, message: 'Access denied. Outside your authorized scope.' });
    }
    next();
  } catch (err) {
    console.error('requireScope error:', err);
    return res.status(500).json({ success: false, message: 'Scope validation failed' });
  }
};

const enforceDepartmentScope = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (['super_admin', 'it_admin'].includes(req.user.role)) return next();
  if (req.user.role !== 'department_admin') {
    return res.status(403).json({ success: false, message: 'Department scope required' });
  }

  const target = req.body?.departmentId || req.params?.departmentId || req.query?.departmentId;
  if (!target) return res.status(400).json({ success: false, message: 'departmentId is required' });
  if (!idsEqual(req.user.departmentId, target)) {
    return res.status(403).json({ success: false, message: 'Access denied. Outside your department.' });
  }
  next();
};

const enforceClassScope = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (['super_admin', 'it_admin', 'department_admin'].includes(req.user.role)) return next();
  if (req.user.role !== 'class_admin') {
    return res.status(403).json({ success: false, message: 'Class scope required' });
  }

  const target = req.body?.classId || req.params?.classId || req.query?.classId;
  if (target && !idsEqual(req.user.classId, target)) {
    return res.status(403).json({ success: false, message: 'Access denied. Outside your class.' });
  }
  next();
};

module.exports = {
  isWithinScope,
  requireScope,
  enforceDepartmentScope,
  enforceClassScope
};