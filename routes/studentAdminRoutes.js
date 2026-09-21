const express = require('express');
const router = express.Router();

const {
  registerStudent, bulkRegisterStudents,
  adminGetStudents, adminGetStudent,
  activateStudent, deactivateStudent
} = require('../controllers/studentController');

const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { uploadExcel, handleUploadError } = require('../middleware/uploadMiddleware')

router.use(protect);
router.use(requireRoles('registration_admin', 'super_admin'));

router.post('/', requirePermission('register_student'), registerStudent);
router.post('/upload', requirePermission('bulk_register_student'), uploadExcel, handleUploadError, bulkRegisterStudents);
router.get('/', requirePermission('view_students'), adminGetStudents);
router.get('/:studentId', requirePermission('view_students'), adminGetStudent);
router.patch('/:studentId/activate', requirePermission('reactivate_student'), activateStudent);
router.patch('/:studentId/deactivate', requirePermission('withdraw_student'), deactivateStudent);

module.exports = router;