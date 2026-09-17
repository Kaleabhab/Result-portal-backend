/**
 * Admin Controller
 * Handles admin account management for all roles
 */

const User = require('../models/User');
const adminService = require('../services/adminService');
const auditService = require('../services/auditLogService');

// ============================================================
// Internal helper — create admin by role
// ============================================================
const createAdminByRole = async (req, res, targetRole) => {
  try {
    // Check privilege escalation
    if (!adminService.canCreateRole(req.user.role, targetRole)) {
      await auditService.logFromRequest(req, 'ADMIN_CREATE_DENIED', {
        result: 'FAILURE',
        targetType: 'User',
        description: `Role ${req.user.role} cannot create ${targetRole}`
      });

      return res.status(403).json({
        success: false,
        message: `Your role cannot create a ${targetRole}`
      });
    }

    const { displayName, email, collegeId, departmentId, classId } = req.body;

    if (!displayName || !email) {
      return res.status(400).json({
        success: false,
        message: 'displayName and email are required'
      });
    }

    const result = await adminService.createAdminAccount({
      displayName,
      email,
      role: targetRole,
      scope: { collegeId, departmentId, classId },
      createdBy: req.user._id
    });

    await auditService.logFromRequest(req, 'ADMIN_CREATED', {
      targetType: 'User',
      targetId: result.user._id,
      metadata: {
        createdRole: targetRole,
        createdEmail: email
      }
    });

    return res.status(201).json({
      success: true,
      message: `${targetRole} created successfully`,
      data: result
    });
  } catch (error) {
    console.error(`createAdminByRole (${targetRole}) error:`, error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create admin'
    });
  }
};

// ============================================================
// SUPER ADMIN — manage IT Admin
// ============================================================
const createITAdmin = (req, res) => createAdminByRole(req, res, 'it_admin');

const getITAdmins = async (req, res) => {
  try {
    const admins = await adminService.listAdminsByRole('it_admin');
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error('getITAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to list IT admins' });
  }
};

// ============================================================
// IT ADMIN — manage Department Admin & Registration Admin
// ============================================================
const createDepartmentAdmin = (req, res) =>
  createAdminByRole(req, res, 'department_admin');

const getDepartmentAdmins = async (req, res) => {
  try {
    const admins = await adminService.listAdminsByRole('department_admin');
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error('getDepartmentAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to list department admins' });
  }
};

const createRegistrationAdmin = (req, res) =>
  createAdminByRole(req, res, 'registration_admin');

const getRegistrationAdmins = async (req, res) => {
  try {
    const admins = await adminService.listAdminsByRole('registration_admin');
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error('getRegistrationAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to list registration admins' });
  }
};

// ============================================================
// DEPARTMENT ADMIN — manage Class Admin
// ============================================================
const createClassAdmin = async (req, res) => {
  try {
    if (!adminService.canCreateRole(req.user.role, 'class_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only Department Admin can create Class Admin'
      });
    }

    const { displayName, email, classId } = req.body;

    if (!displayName || !email || !classId) {
      return res.status(400).json({
        success: false,
        message: 'displayName, email, and classId are required'
      });
    }

    // Verify class belongs to the department admin's department
    const Class = require('../models/Academic/Class');
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classObj.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Class does not belong to your department'
      });
    }

    const result = await adminService.createAdminAccount({
      displayName,
      email,
      role: 'class_admin',
      scope: { classId },
      createdBy: req.user._id
    });

    await auditService.logFromRequest(req, 'CLASS_ADMIN_CREATED', {
      targetType: 'User',
      targetId: result.user._id,
      metadata: { classId, email }
    });

    res.status(201).json({
      success: true,
      message: 'Class Admin created successfully',
      data: result
    });
  } catch (error) {
    console.error('createClassAdmin error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getClassAdmins = async (req, res) => {
  try {
    let filter = {};
    // If department admin, filter to own department
    if (req.user.role === 'department_admin') {
      filter.departmentId = req.user.departmentId;
    }

    const admins = await adminService.listAdminsByRole('class_admin', filter);
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error('getClassAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to list class admins' });
  }
};

// ============================================================
// Generic activate/deactivate
// ============================================================
const activateAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if the actor can manage this target
    if (!adminService.canCreateRole(req.user.role, user.role)) {
      return res.status(403).json({
        success: false,
        message: `You cannot manage a ${user.role}`
      });
    }

    const updated = await adminService.setAdminActive(user._id, true, req.user._id);

    await auditService.logFromRequest(req, 'ADMIN_ACTIVATED', {
      targetType: 'User',
      targetId: user._id,
      metadata: { targetRole: user.role }
    });

    res.status(200).json({ success: true, message: 'Admin activated', data: updated });
  } catch (error) {
    console.error('activateAdmin error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deactivateAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent self-deactivation
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    if (!adminService.canCreateRole(req.user.role, user.role)) {
      return res.status(403).json({
        success: false,
        message: `You cannot manage a ${user.role}`
      });
    }

    const updated = await adminService.setAdminActive(user._id, false, req.user._id);

    await auditService.logFromRequest(req, 'ADMIN_DEACTIVATED', {
      targetType: 'User',
      targetId: user._id,
      metadata: { targetRole: user.role }
    });

    res.status(200).json({ success: true, message: 'Admin deactivated', data: updated });
  } catch (error) {
    console.error('deactivateAdmin error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// Reset password
// ============================================================
const resetAdminPasswordHandler = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!adminService.canCreateRole(req.user.role, user.role)) {
      return res.status(403).json({
        success: false,
        message: `You cannot manage a ${user.role}`
      });
    }

    const { user: updated, temporaryPassword } =
      await adminService.resetAdminPassword(user._id, req.user._id);

    await auditService.logFromRequest(req, 'ADMIN_PASSWORD_RESET', {
      targetType: 'User',
      targetId: user._id,
      metadata: { targetRole: user.role }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: updated._id,
        email: updated.email,
        temporaryPassword
      }
    });
  } catch (error) {
    console.error('resetAdminPasswordHandler error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// Get single admin
// ============================================================
const getAdminById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('collegeId', 'name code')
      .populate('departmentId', 'name code')
      .populate('academicLevelId', 'name code')
      .populate('classId', 'name code')
      .select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getAdminById error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin' });
  }
};

// ============================================================
// Get all admins
// ============================================================
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ['super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'] }
    })
      .populate('collegeId', 'name code')
      .populate('departmentId', 'name code')
      .populate('classId', 'name code')
      .select('-password')
      .sort({ role: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error('getAllAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to list admins' });
  }
};

// ============================================================
// Audit log views
// ============================================================
const getAuditLogs = async (req, res) => {
  try {
    const { actorId, action, targetType, targetId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    const result = await auditService.getLogs(filter, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
  }
};

module.exports = {
  createITAdmin,
  getITAdmins,
  createDepartmentAdmin,
  getDepartmentAdmins,
  createRegistrationAdmin,
  getRegistrationAdmins,
  createClassAdmin,
  getClassAdmins,
  activateAdmin,
  deactivateAdmin,
  resetAdminPassword: resetAdminPasswordHandler,
  getAdminById,
  getAllAdmins,
  getAuditLogs
};