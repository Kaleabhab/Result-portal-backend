/**
 * Permission Middleware — reusable across the whole project
 * Reads from utils/permissions.js
 */

const { roleHasPermission, roleHasAnyPermission } = require('../utils/permissions');

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!roleHasPermission(req.user.role, permission)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Missing permission: ${permission}`
    });
  }
  next();
};

const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!roleHasAnyPermission(req.user.role, permissions)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${permissions.join(', ')}`
    });
  }
  next();
};

module.exports = { requirePermission, requireAnyPermission };