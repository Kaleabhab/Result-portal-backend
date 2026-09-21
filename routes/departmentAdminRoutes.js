const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { departmentAdminOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const studentController = require('../controllers/studentController');
const resultController = require('../controllers/results/resultController');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(departmentAdminOnly);

// STUDENTS IN OWN DEPARTMENT
router.get('/students', requirePermission('view_department_students'), studentController.getDepartmentStudents);
router.get('/students/by-level', requirePermission('view_department_students'), studentController.getStudentsByLevel);
router.get('/students/by-class', requirePermission('view_department_students'), studentController.getStudentsByClass);
router.get('/students/filter', requirePermission('view_department_students'), studentController.filterStudents);
router.get('/students/:studentId', requirePermission('view_department_students'), studentController.getDepartmentStudent);

// CLASS ADMIN APPROVALS (alias to admin management handlers)
router.get('/class-approvals', requirePermission('approve_class_admin'), adminController.listApprovals);
router.post('/class-approvals', requirePermission('approve_class_admin'), adminController.createApproval);
router.patch('/class-approvals/:id/revoke', requirePermission('approve_class_admin'), adminController.revokeApproval);
router.get('/class-approvals/:id', requirePermission('approve_class_admin'), adminController.getApproval);

// DEPARTMENT-LEVEL RESULT VIEWS
router.get('/results', requirePermission('manage_results'), resultController.getDepartmentResults);
router.get('/results/class/:classId', requirePermission('manage_results'), resultController.getDepartmentClassResults);
router.get('/results/period/:academicPeriodId', requirePermission('manage_results'), resultController.getPeriodResults);

module.exports = router;