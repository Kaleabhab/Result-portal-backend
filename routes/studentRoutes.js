const express = require('express');
const router = express.Router();
const {
  registerStudent,
  bulkRegisterStudents,
  adminGetStudents,
  adminGetStudent,
  getMyProfile,
  updateMyProfile,
  activateStudent,
  deactivateStudent
} = require('../controllers/studentController');
const {
  registrationAdminOnly,
  superAdminOnly,
  requireRoles
} = require('../middleware/roleMiddleware');

const { requirePermission } = require('../middleware/permissionMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, studentOnly } = require('../middleware/roleMiddleware');

// Student-facing routes
router.get('/me', protect, studentOnly, getMyProfile);
router.patch('/me', protect, studentOnly, updateMyProfile);

// Admin-only routes
router.post(
  '/admin/register',
  protect,
  requireRoles('registration_admin', 'super_admin'),
  requirePermission('register_student'),
  registerStudent
);
router.post(
  '/admin/bulk-register',
  protect,
  requireRoles('registration_admin', 'super_admin'),
  requirePermission('bulk_register_student'),
  bulkRegisterStudents
);
router.get(
  '/admin/:studentId',
  protect,
  requireRoles('registration_admin', 'super_admin'),
  requirePermission('view_students'),
  adminGetStudent
);
router.patch(
  '/admin/:studentId/activate',
  protect,
  requireRoles('registration_admin', 'super_admin'),
  requirePermission('reactivate_student'),
  activateStudent
);

router.patch(
  '/admin/:studentId/deactivate',
  protect,
  requireRoles('registration_admin', 'super_admin'),
  requirePermission('withdraw_student'),
  deactivateStudent
);
//router.post('/admin/bulk-register', protect, adminOnly, bulkRegisterStudents);
//router.get('/admin', protect, adminOnly, adminGetStudents);
//router.get('/admin/:studentId', protect, adminOnly, adminGetStudent);
//router.patch('/admin/:studentId/activate', protect, adminOnly, activateStudent);
//router.patch('/admin/:studentId/deactivate', protect, adminOnly, deactivateStudent);

module.exports = router;