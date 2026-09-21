const express = require('express');
const router = express.Router();

const { getMyProfile, updateMyProfile } = require('../controllers/studentController');

const { protect } = require('../middleware/authMiddleware');
const { studentOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

router.use(protect);
router.use(studentOnly);

router.get('/me', requirePermission('view_own_profile'), getMyProfile);
router.patch('/me', requirePermission('update_own_profile'), updateMyProfile);

module.exports = router;