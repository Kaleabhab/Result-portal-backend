/**
 * Scope Middleware
 * Checks if the target resource is within the authenticated user's scope
 * 
 * Scope rules:
 * - super_admin      → global (no restriction)
 * - it_admin         → global for account management
 * - department_admin → must match departmentId
 * - registration_admin → must match collegeId
 * - class_admin      → must match classId
 * - student          → must match own studentId
 */

const mongoose = require('mongoose');

// ============================================================
// Helper: Check if ID matches
// ============================================================
const idsMatch = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

// ============================================================
// Check if the given target is within the user's scope
// ============================================================
const isWithinScope = (user, target) => {
  if (!user) return false;

  switch (user.role) {
    case 'super_admin':
    case 'it_admin':
      // Global scope
      return true;

    case 'department_admin':
      // Must match department
      if (target.departmentId) {
        return idsMatch(user.departmentId, target.departmentId);
      }
      return false;

    case 'registration_admin':
      // Must match college
      if (target.collegeId) {
        return idsMatch(user.collegeId, target.collegeId);
      }
      return false;

    case 'class_admin':
      // Must match class
      if (target.classId) {
        return idsMatch(user.classId, target.classId);
      }
      return false;

    case 'student':
      // Must match own studentId
      if (target.studentId) {
        return idsMatch(user.studentId, target.studentId);
      }
      return false;

    default:
      return false;
  }
};

// ============================================================
// requireScope — Middleware factory
// 
// Usage:
//   router.get('/departments/:id', 
//     protect, 
//     requireScope('department'),  // where to look for the target
//     controller)
// ============================================================
const requireScope = (source) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Super Admin and IT Admin bypass
      if (req.user.role === 'super_admin' || req.user.role === 'it_admin') {
        return next();
      }

      let target = {};

      switch (source) {
        case 'body':
          target = req.body;
          break;

        case 'params':
          target = req.params;
          break;

        case 'query':
          target = req.query;
          break;

        case 'department':
          // Extract departmentId from body, params, or query
          target = {
            departmentId: req.body.departmentId || req.params.departmentId || req.query.departmentId
          };
          break;

        case 'college':
          target = {
            collegeId: req.body.collegeId || req.params.collegeId || req.query.collegeId
          };
          break;

        case 'class':
          target = {
            classId: req.body.classId || req.params.classId || req.query.classId
          };
          break;

        case 'student':
          target = {
            studentId: req.body.studentId || req.params.studentId || req.query.studentId
          };
          break;

        default:
          target = {};
      }

      if (!isWithinScope(req.user, target)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Target is outside your authorized scope.'
        });
      }

      next();
    } catch (error) {
      console.error('Scope middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Scope validation failed'
      });
    }
  };
};

// ============================================================
// enforceDepartmentScope — Specific check for department-scoped admins
// ============================================================
const enforceDepartmentScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Super Admin and IT Admin bypass
  if (['super_admin', 'it_admin'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role !== 'department_admin') {
    return res.status(403).json({
      success: false,
      message: 'Department scope required'
    });
  }

  const targetDeptId =
    req.body.departmentId ||
    req.params.departmentId ||
    req.query.departmentId;

  if (!targetDeptId) {
    return res.status(400).json({
      success: false,
      message: 'departmentId is required'
    });
  }

  if (!idsMatch(req.user.departmentId, targetDeptId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Target is outside your department.'
    });
  }

  next();
};

// ============================================================
// enforceClassScope — Specific check for class-scoped admins
// ============================================================
const enforceClassScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (['super_admin', 'it_admin', 'department_admin'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role !== 'class_admin') {
    return res.status(403).json({
      success: false,
      message: 'Class scope required'
    });
  }

  const targetClassId =
    req.body.classId ||
    req.params.classId ||
    req.query.classId;

  if (targetClassId && !idsMatch(req.user.classId, targetClassId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Target is outside your assigned class.'
    });
  }

  next();
};

module.exports = {
  isWithinScope,
  requireScope,
  enforceDepartmentScope,
  enforceClassScope
};