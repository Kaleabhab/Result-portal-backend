/**
 * Admin Controller — Admin Management (37 handlers)
 */

const User = require('../models/User');
const Class = require('../models/Academic/Class');
const AcademicLevel = require('../models/Academic/AcademicLevel');
const Department = require('../models/Academic/Department');
const College = require('../models/Academic/College');
const AuditLog = require('../models/AuditLog');

const { ROLE_HIERARCHY, AUDIT_ACTIONS } = require('../config/adminConfig');

// ============================================================
// HELPERS
// ============================================================
const generateTempPassword = (displayName) => {
  const parts = displayName.trim().split(' ');
  const first = parts[0]?.charAt(0).toUpperCase() || 'A';
  const last = parts[parts.length - 1]?.charAt(0).toUpperCase() || 'D';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${first}${last}${num}!`;
};

const audit = async (req, action, options = {}) => {
  try {
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action,
      targetType: options.targetType,
      targetId: options.targetId,
      result: options.result || 'SUCCESS',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get?.('user-agent'),
      metadata: options.metadata || {},
      description: options.description
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

const canCreateRole = (creatorRole, targetRole) => {
  return (ROLE_HIERARCHY[creatorRole] || []).includes(targetRole);
};

const buildAndValidateScope = async (role, rawScope) => {
  const scope = {};

  if (role === 'super_admin' || role === 'it_admin') return scope;

  if (role === 'department_admin') {
    if (!rawScope.departmentId) throw new Error('departmentId is required');
    const dept = await Department.findById(rawScope.departmentId);
    if (!dept) throw new Error('Department not found');
    scope.departmentId = dept._id;
    scope.collegeId = dept.collegeId;
    return scope;
  }

  if (role === 'registration_admin') {
    if (!rawScope.collegeId) throw new Error('collegeId is required');
    const college = await College.findById(rawScope.collegeId);
    if (!college) throw new Error('College not found');
    scope.collegeId = college._id;
    return scope;
  }

  if (role === 'class_admin') {
    if (!rawScope.classId) throw new Error('classId is required');
    const cls = await Class.findById(rawScope.classId);
    if (!cls) throw new Error('Class not found');

    scope.classId = cls._id;
    scope.academicLevelId = cls.academicLevelId;
    scope.departmentId = cls.departmentId;

    const level = await AcademicLevel.findById(cls.academicLevelId);
    if (level) {
      const dept = await Department.findById(level.departmentId);
      if (dept) scope.collegeId = dept.collegeId;
    }
    return scope;
  }

  throw new Error(`Unknown role: ${role}`);
};

// ============================================================
// GENERIC HANDLERS
// ============================================================
const createAdminGeneric = async (req, res, targetRole) => {
  try {
    if (!canCreateRole(req.user.role, targetRole)) {
      await audit(req, AUDIT_ACTIONS.ADMIN_CREATE_DENIED, {
        result: 'FAILURE',
        targetType: 'User',
        description: `${req.user.role} cannot create ${targetRole}`
      });
      return res.status(403).json({
        success: false,
        message: `Your role cannot create a ${targetRole}`
      });
    }

    const { displayName, email, departmentId, collegeId, classId } = req.body;
    if (!displayName || !email) {
      return res.status(400).json({ success: false, message: 'displayName and email are required' });
    }

    const scope = await buildAndValidateScope(targetRole, { departmentId, collegeId, classId });

    // Department Admin → only own department's class admin
    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      if (!scope.departmentId || scope.departmentId.toString() !== req.user.departmentId.toString()) {
        return res.status(403).json({ success: false, message: 'Class does not belong to your department' });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const tempPassword = generateTempPassword(displayName);

    const user = await User.create({
      displayName,
      email,
      password: tempPassword,
      role: targetRole,
      collegeId: scope.collegeId || null,
      departmentId: scope.departmentId || null,
      academicLevelId: scope.academicLevelId || null,
      classId: scope.classId || null,
      isActive: true,
      mustChangePassword: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await audit(req, AUDIT_ACTIONS.ADMIN_CREATED, {
      targetType: 'User',
      targetId: user._id,
      metadata: { role: targetRole, email }
    });

    res.status(201).json({
      success: true,
      message: `${targetRole} created successfully`,
      data: {
        user: {
          _id: user._id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          collegeId: user.collegeId,
          departmentId: user.departmentId,
          academicLevelId: user.academicLevelId,
          classId: user.classId,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword
        },
        temporaryPassword: tempPassword
      }
    });
  } catch (error) {
    console.error(`createAdminGeneric (${targetRole}) error:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const listAdminsGeneric = async (req, res, targetRole) => {
  try {
    const filter = { role: targetRole };
    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      filter.departmentId = req.user.departmentId;
    }

    const admins = await User.find(filter)
      .populate('collegeId', 'name code')
      .populate('departmentId', 'name code')
      .populate('academicLevelId', 'name code')
      .populate('classId', 'name code')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    console.error(`listAdminsGeneric (${targetRole}) error:`, error);
    res.status(500).json({ success: false, message: 'Failed to list admins' });
  }
};

const getAdminGeneric = async (req, res, targetRole) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: targetRole })
      .populate('collegeId', 'name code')
      .populate('departmentId', 'name code')
      .populate('academicLevelId', 'name code')
      .populate('classId', 'name code')
      .select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      if (!user.departmentId || user.departmentId._id.toString() !== req.user.departmentId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. Outside your department.' });
      }
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`getAdminGeneric (${targetRole}) error:`, error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin' });
  }
};

const updateAdminGeneric = async (req, res, targetRole) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: targetRole });
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      if (!user.departmentId || user.departmentId.toString() !== req.user.departmentId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. Outside your department.' });
      }
    }

    const { displayName } = req.body;
    if (displayName !== undefined) user.displayName = displayName;
    user.updatedBy = req.user._id;
    await user.save();

    await audit(req, AUDIT_ACTIONS.ADMIN_UPDATED, {
      targetType: 'User',
      targetId: user._id,
      metadata: { role: targetRole }
    });

    res.status(200).json({
      success: true,
      message: 'Admin updated',
      data: { _id: user._id, displayName: user.displayName }
    });
  } catch (error) {
    console.error(`updateAdminGeneric (${targetRole}) error:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const setActiveGeneric = async (req, res, targetRole, isActive) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: targetRole });
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (isActive === false && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      if (!user.departmentId || user.departmentId.toString() !== req.user.departmentId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. Outside your department.' });
      }
    }

    user.isActive = isActive;
    user.updatedBy = req.user._id;
    await user.save();

    await audit(
      req,
      isActive ? AUDIT_ACTIONS.ADMIN_ACTIVATED : AUDIT_ACTIONS.ADMIN_DEACTIVATED,
      { targetType: 'User', targetId: user._id, metadata: { role: targetRole } }
    );

    res.status(200).json({
      success: true,
      message: isActive ? 'Admin activated' : 'Admin deactivated',
      data: { _id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    console.error(`setActiveGeneric (${targetRole}) error:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPasswordGeneric = async (req, res, targetRole) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: targetRole });
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (req.user.role === 'department_admin' && targetRole === 'class_admin') {
      if (!user.departmentId || user.departmentId.toString() !== req.user.departmentId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. Outside your department.' });
      }
    }

    const tempPassword = generateTempPassword(user.displayName);
    user.password = tempPassword;
    user.mustChangePassword = true;
    user.updatedBy = req.user._id;
    await user.save();

    await audit(req, AUDIT_ACTIONS.ADMIN_PASSWORD_RESET, {
      targetType: 'User',
      targetId: user._id,
      metadata: { role: targetRole }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: { _id: user._id, email: user.email, temporaryPassword: tempPassword }
    });
  } catch (error) {
    console.error(`resetPasswordGeneric (${targetRole}) error:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN → IT Admin (7)
// ============================================================
const createITAdmin = (req, res) => createAdminGeneric(req, res, 'it_admin');
const getITAdmins = (req, res) => listAdminsGeneric(req, res, 'it_admin');
const getITAdmin = (req, res) => getAdminGeneric(req, res, 'it_admin');
const updateITAdmin = (req, res) => updateAdminGeneric(req, res, 'it_admin');
const activateITAdmin = (req, res) => setActiveGeneric(req, res, 'it_admin', true);
const deactivateITAdmin = (req, res) => setActiveGeneric(req, res, 'it_admin', false);
const resetITAdminPassword = (req, res) => resetPasswordGeneric(req, res, 'it_admin');

// ============================================================
// IT ADMIN → Department Admin (7)
// ============================================================
const createDepartmentAdmin = (req, res) => createAdminGeneric(req, res, 'department_admin');
const getDepartmentAdmins = (req, res) => listAdminsGeneric(req, res, 'department_admin');
const getDepartmentAdmin = (req, res) => getAdminGeneric(req, res, 'department_admin');
const updateDepartmentAdmin = (req, res) => updateAdminGeneric(req, res, 'department_admin');
const activateDepartmentAdmin = (req, res) => setActiveGeneric(req, res, 'department_admin', true);
const deactivateDepartmentAdmin = (req, res) => setActiveGeneric(req, res, 'department_admin', false);
const resetDepartmentAdminPassword = (req, res) => resetPasswordGeneric(req, res, 'department_admin');

// ============================================================
// IT ADMIN → Registration Admin (7)
// ============================================================
const createRegistrationAdmin = (req, res) => createAdminGeneric(req, res, 'registration_admin');
const getRegistrationAdmins = (req, res) => listAdminsGeneric(req, res, 'registration_admin');
const getRegistrationAdmin = (req, res) => getAdminGeneric(req, res, 'registration_admin');
const updateRegistrationAdmin = (req, res) => updateAdminGeneric(req, res, 'registration_admin');
const activateRegistrationAdmin = (req, res) => setActiveGeneric(req, res, 'registration_admin', true);
const deactivateRegistrationAdmin = (req, res) => setActiveGeneric(req, res, 'registration_admin', false);
const resetRegistrationAdminPassword = (req, res) => resetPasswordGeneric(req, res, 'registration_admin');

// ============================================================
// DEPARTMENT ADMIN → Class Admin (7)
// ============================================================
const createClassAdmin = (req, res) => createAdminGeneric(req, res, 'class_admin');
const getClassAdmins = (req, res) => listAdminsGeneric(req, res, 'class_admin');
const getClassAdmin = (req, res) => getAdminGeneric(req, res, 'class_admin');
const updateClassAdmin = (req, res) => updateAdminGeneric(req, res, 'class_admin');
const activateClassAdmin = (req, res) => setActiveGeneric(req, res, 'class_admin', true);
const deactivateClassAdmin = (req, res) => setActiveGeneric(req, res, 'class_admin', false);
const resetClassAdminPassword = (req, res) => resetPasswordGeneric(req, res, 'class_admin');

// ============================================================
// ADMIN ACCOUNT / ACCESS MANAGEMENT (3)
// ============================================================
const updateAdminPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    await audit(req, AUDIT_ACTIONS.ADMIN_PERMISSIONS_UPDATED, {
      targetType: 'User',
      targetId: user._id,
      metadata: { note: 'Permissions derived from role' }
    });

    res.status(200).json({
      success: true,
      message: 'Permissions are derived from role. No override applied.',
      data: { _id: user._id, role: user.role }
    });
  } catch (error) {
    console.error('updateAdminPermissions error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAdminScope = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });

    const { collegeId, departmentId, classId } = req.body;
    const newScope = await buildAndValidateScope(user.role, { collegeId, departmentId, classId });

    user.collegeId = newScope.collegeId ?? user.collegeId;
    user.departmentId = newScope.departmentId ?? user.departmentId;
    user.academicLevelId = newScope.academicLevelId ?? user.academicLevelId;
    user.classId = newScope.classId ?? user.classId;
    user.updatedBy = req.user._id;
    await user.save();

    await audit(req, AUDIT_ACTIONS.ADMIN_SCOPE_UPDATED, {
      targetType: 'User',
      targetId: user._id,
      metadata: { role: user.role }
    });

    res.status(200).json({
      success: true,
      message: 'Admin scope updated',
      data: {
        _id: user._id,
        collegeId: user.collegeId,
        departmentId: user.departmentId,
        academicLevelId: user.academicLevelId,
        classId: user.classId
      }
    });
  } catch (error) {
    console.error('updateAdminScope error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAdminAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('collegeId', 'name code')
      .populate('departmentId', 'name code')
      .populate('academicLevelId', 'name code')
      .populate('classId', 'name code')
      .populate('createdBy', 'displayName email role')
      .populate('updatedBy', 'displayName email role')
      .select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getAdminAccount error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin account' });
  }
};

// ============================================================
// IT SYSTEM MANAGEMENT — stubs
// ============================================================
const makeStub = (action) => async (req, res) => {
  await audit(req, action, { metadata: { endpoint: req.originalUrl } });
  res.status(200).json({
    success: true,
    message: `${action} acknowledged`,
    note: 'Stub endpoint. Implement as needed.'
  });
};

const systemConfiguration = makeStub(AUDIT_ACTIONS.SYSTEM_CONFIGURATION);
const serverApplicationConfiguration = makeStub(AUDIT_ACTIONS.SERVER_APPLICATION_CONFIGURATION);
const databaseMaintenance = makeStub(AUDIT_ACTIONS.DATABASE_MAINTENANCE);
const authenticationInfrastructure = makeStub(AUDIT_ACTIONS.AUTHENTICATION_INFRASTRUCTURE);
const securityConfiguration = makeStub(AUDIT_ACTIONS.SECURITY_CONFIGURATION);
const backupRecovery = makeStub(AUDIT_ACTIONS.BACKUP_RECOVERY);
const technicalMonitoring = makeStub(AUDIT_ACTIONS.TECHNICAL_MONITORING);
const systemHealth = makeStub(AUDIT_ACTIONS.SYSTEM_HEALTH);
const integrationConfiguration = makeStub(AUDIT_ACTIONS.INTEGRATION_CONFIGURATION);
const emailSystemConfiguration = makeStub(AUDIT_ACTIONS.EMAIL_SYSTEM_CONFIGURATION);
const technicalAccessConfiguration = makeStub(AUDIT_ACTIONS.TECHNICAL_ACCESS_CONFIGURATION);

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  // IT Admin (7)
  createITAdmin, getITAdmins, getITAdmin, updateITAdmin,
  activateITAdmin, deactivateITAdmin, resetITAdminPassword,

  // Department Admin (7)
  createDepartmentAdmin, getDepartmentAdmins, getDepartmentAdmin, updateDepartmentAdmin,
  activateDepartmentAdmin, deactivateDepartmentAdmin, resetDepartmentAdminPassword,

  // Registration Admin (7)
  createRegistrationAdmin, getRegistrationAdmins, getRegistrationAdmin, updateRegistrationAdmin,
  activateRegistrationAdmin, deactivateRegistrationAdmin, resetRegistrationAdminPassword,

  // Class Admin (7)
  createClassAdmin, getClassAdmins, getClassAdmin, updateClassAdmin,
  activateClassAdmin, deactivateClassAdmin, resetClassAdminPassword,

  // Admin Account (3)
  updateAdminPermissions, updateAdminScope, getAdminAccount,

  // IT System (11)
  systemConfiguration, serverApplicationConfiguration, databaseMaintenance,
  authenticationInfrastructure, securityConfiguration, backupRecovery,
  technicalMonitoring, systemHealth, integrationConfiguration,
  emailSystemConfiguration, technicalAccessConfiguration
};