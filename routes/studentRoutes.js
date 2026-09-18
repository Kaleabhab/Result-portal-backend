const express = require('express');
const router = express.Router();

// Controller
const {
  getMyProfile,
  updateMyProfile,
} = require('../controllers/studentAdminController');

// Middleware
const { protect } = require('../middleware/authMiddleware');
const { studentOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// ============================================================
// ALL routes require authentication + student role
// ============================================================
router.use(protect);
router.use(studentOnly);

// ============================================================
// GET /api/students/me
// Get own profile
// ============================================================
router.get(
  '/me',
  requirePermission('view_own_profile'),
  getMyProfile
);

// ============================================================
// PATCH /api/students/me
// Update own profile (limited fields)
// ============================================================
router.patch(
  '/me',
  requirePermission('update_own_profile'),
  updateMyProfile
);

module.exports = router;