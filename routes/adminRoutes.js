const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const {
  superAdminOnly,
  itAdminOnly,
  departmentAdminOnly
} = require('../middleware/roleMiddleware');
const {
  requirePermission
} = require('../middleware/permissionMiddleware');

// All admin routes require authentication
router.use(protect);

// ============================================================
// SUPER ADMIN — IT Admin management
// ============================================================
router.post(
  '/it-admins',
  superAdminOnly,
  requirePermission('manage_it_admin'),
  adminController.createITAdmin
);

router.get(
  '/it-admins',
  superAdminOnly,
  adminController.getITAdmins
);

// ============================================================
// IT ADMIN — Department Admin management
// ============================================================
router.post(
  '/department-admins',
  itAdminOnly,
  requirePermission('manage_department_admin'),
  adminController.createDepartmentAdmin
);

router.get(
  '/department-admins',
  itAdminOnly,
  adminController.getDepartmentAdmins
);

// ============================================================
// IT ADMIN — Registration Admin management
// ============================================================
router.post(
  '/registration-admins',
  itAdminOnly,
  requirePermission('manage_registration_admin'),
  adminController.createRegistrationAdmin
);

router.get(
  '/registration-admins',
  itAdminOnly,
  adminController.getRegistrationAdmins
);

// ============================================================
// DEPARTMENT ADMIN — Class Admin management
// ============================================================
router.post(
  '/class-admins',
  departmentAdminOnly,
  requirePermission('manage_class_admin'),
  adminController.createClassAdmin
);

router.get(
  '/class-admins',
  departmentAdminOnly,
  adminController.getClassAdmins
);

// ============================================================
// GENERIC: Activate / Deactivate / Reset / Get
// (permission checked inside controller)
// ============================================================
router.get('/:id', adminController.getAdminById);

router.patch('/:id/activate', adminController.activateAdmin);
router.patch('/:id/deactivate', adminController.deactivateAdmin);
router.patch('/:id/reset-password', adminController.resetAdminPassword);

// ============================================================
// SUPER ADMIN — View all admins
// ============================================================
router.get(
  '/',
  superAdminOnly,
  adminController.getAllAdmins
);

// ============================================================
// SUPER ADMIN — Audit logs
// ============================================================
router.get(
  '/audit-logs',
  superAdminOnly,
  requirePermission('manage_audit_logs'),
  adminController.getAuditLogs
);

module.exports = router;