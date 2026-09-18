const express = require('express');
const router = express.Router();

// Controller
const {
  registerStudent,
  bulkRegisterStudents,
  adminGetStudents,
  adminGetStudent,
  activateStudent,
  deactivateStudent,
} = require('../controllers/studentAdminController');

// Middleware
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { requireScope } = require('../middleware/scopeMiddleware');
const uploadExcel = require('../middleware/upload');

// ============================================================
// ALL routes require authentication
// ============================================================
router.use(protect);

// ============================================================
// ALL routes require registration_admin or super_admin role
// ============================================================
router.use(requireRoles('registration_admin', 'super_admin'));

// ============================================================
// POST /api/admin/students
// Register one student
// ============================================================
router.post(
  '/',
  requirePermission('register_student'),
  registerStudent
);

// ============================================================
// POST /api/admin/students/upload
// Bulk register students from Excel
// ============================================================
router.post(
  '/upload',
  requirePermission('bulk_register_student'),
  uploadExcel,
  bulkRegisterStudents
);

// ============================================================
// GET /api/admin/students
// List all students (scoped by college for registration_admin)
// ============================================================
router.get(
  '/',
  requirePermission('view_students'),
  adminGetStudents
);

// ============================================================
// GET /api/admin/students/:studentId
// Get one student
// ============================================================
router.get(
  '/:studentId',
  requirePermission('view_students'),
  adminGetStudent
);

// ============================================================
// PATCH /api/admin/students/:studentId/activate
// Activate a student account
// ============================================================
router.patch(
  '/:studentId/activate',
  requirePermission('reactivate_student'),
  activateStudent
);

// ============================================================
// PATCH /api/admin/students/:studentId/deactivate
// Deactivate a student account (withdraw)
// ============================================================
router.patch(
  '/:studentId/deactivate',
  requirePermission('withdraw_student'),
  deactivateStudent
);

module.exports = router;