/**
 * Admin Service
 * Business logic for admin account management
 */

const User = require('../models/User');
const College = require('../models/Academic/College');
const Department = require('../models/Academic/Department');
const AcademicLevel = require('../models/Academic/AcademicLevel');
const Class = require('../models/Academic/Class');

// ============================================================
// Generate temporary password for new admin
// ============================================================
const generateAdminTempPassword = (displayName) => {
  const parts = displayName.trim().split(' ');
  const firstInitial = parts[0]?.charAt(0).toUpperCase() || 'A';
  const lastInitial = parts[parts.length - 1]?.charAt(0).toUpperCase() || 'D';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${firstInitial}${lastInitial}${randomNum}!`;
};

// ============================================================
// Validate scope based on role
// ============================================================
const validateScope = async (role, scope) => {
  switch (role) {
    case 'super_admin':
      // No scope needed
      return true;

    case 'it_admin':
      // No specific scope needed
      return true;

    case 'department_admin':
      if (!scope.departmentId) {
        throw new Error('departmentId is required for department_admin');
      }
      const dept = await Department.findById(scope.departmentId);
      if (!dept) {
        throw new Error('Department not found');
      }
      return true;

    case 'registration_admin':
      if (!scope.collegeId) {
        throw new Error('collegeId is required for registration_admin');
      }
      const college = await College.findById(scope.collegeId);
      if (!college) {
        throw new Error('College not found');
      }
      return true;

    case 'class_admin':
      if (!scope.classId) {
        throw new Error('classId is required for class_admin');
      }
      const classObj = await Class.findById(scope.classId);
      if (!classObj) {
        throw new Error('Class not found');
      }
      // Auto-fill department and college from class
      const level = await AcademicLevel.findById(classObj.academicLevelId);
      if (level) {
        scope.academicLevelId = level._id;
        scope.departmentId = level.departmentId;
      }
      return true;

    default:
      throw new Error(`Unknown role: ${role}`);
  }
};

// ============================================================
// Check privilege escalation
// ============================================================
const canCreateRole = (creatorRole, targetRole) => {
  const allowedCreations = {
    super_admin: ['it_admin'],
    it_admin: ['department_admin', 'registration_admin'],
    department_admin: ['class_admin'],
    registration_admin: ['student'],
    class_admin: [],
    student: []
  };

  const allowed = allowedCreations[creatorRole] || [];
  return allowed.includes(targetRole);
};

// ============================================================
// Create admin account (generic)
// ============================================================
const createAdminAccount = async ({
  displayName,
  email,
  role,
  scope = {},
  createdBy
}) => {
  // Validate email uniqueness
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('Email already exists');
  }

  // Validate scope
  await validateScope(role, scope);

  // Generate temporary password
  const tempPassword = generateAdminTempPassword(displayName);

  // Create user
  const user = await User.create({
    displayName,
    email,
    password: tempPassword,
    role,
    collegeId: scope.collegeId || null,
    departmentId: scope.departmentId || null,
    academicLevelId: scope.academicLevelId || null,
    classId: scope.classId || null,
    isActive: true,
    mustChangePassword: true,
    createdBy,
    updatedBy: createdBy
  });

  return {
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
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt
    },
    temporaryPassword: tempPassword
  };
};

// ============================================================
// List admins by role (with optional scope filter)
// ============================================================
const listAdminsByRole = async (role, filter = {}) => {
  const query = { role, ...filter };
  const admins = await User.find(query)
    .populate('collegeId', 'name code')
    .populate('departmentId', 'name code')
    .populate('classId', 'name code')
    .select('-password')
    .sort({ createdAt: -1 });

  return admins;
};

// ============================================================
// Activate / Deactivate
// ============================================================
const setAdminActive = async (userId, isActive, updatedBy) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.isAdmin()) {
    throw new Error('Target is not an administrator');
  }

  user.isActive = isActive;
  user.updatedBy = updatedBy;
  await user.save();

  return user;
};

// ============================================================
// Reset password
// ============================================================
const resetAdminPassword = async (userId, updatedBy) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.isAdmin()) {
    throw new Error('Target is not an administrator');
  }

  const tempPassword = generateAdminTempPassword(user.displayName);
  user.password = tempPassword;
  user.mustChangePassword = true;
  user.updatedBy = updatedBy;
  await user.save();

  return { user, temporaryPassword: tempPassword };
};

module.exports = {
  generateAdminTempPassword,
  validateScope,
  canCreateRole,
  createAdminAccount,
  listAdminsByRole,
  setAdminActive,
  resetAdminPassword
};