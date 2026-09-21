const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireRoles, studentOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { enforceClassScope, enforceDepartmentScope } = require('../middleware/scopeMiddleware');

const resultController = require('../controllers/results/resultController');
const reExamController = require('../controllers/results/reExamController');
const progressionController = require('../controllers/results/progressionController');
const resultReleaseController = require('../controllers/results/resultReleaseController');

router.use(protect);

// STUDENT SELF-SERVICE
router.get('/student/me', studentOnly, requirePermission('view_own_results'), resultController.getMyResults);
router.get('/student/me/modules', studentOnly, requirePermission('view_own_results'), resultController.getMyModuleResults);

// RE-EXAMS
router.post('/re-exams', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), reExamController.createReExam);
router.get('/re-exams/attempts', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), reExamController.getAttempts);
router.get('/re-exams/eligible', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), reExamController.getEligibleStudents);

// PROGRESSION
router.post('/progression/evaluate', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), progressionController.evaluateProgression);
router.get('/progression', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), progressionController.getProgressionRecords);
router.get('/progression/student/:studentId', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), progressionController.getStudentProgression);
router.post('/progression/:recordId/apply', requireRoles('super_admin', 'department_admin'), requirePermission('approve_lag'), progressionController.applyLag);
router.patch('/progression/:recordId', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), progressionController.updateProgressionRecord);

// RELEASE
router.patch('/modules/:moduleId/release', requireRoles('super_admin', 'department_admin'), requirePermission('release_results'), enforceDepartmentScope, resultReleaseController.releaseModule);
router.patch('/modules/:moduleId/unrelease', requireRoles('super_admin', 'department_admin'), requirePermission('release_results'), enforceDepartmentScope, resultReleaseController.unreleaseModule);
router.get('/modules/:moduleId/release-status', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), resultReleaseController.getReleaseStatus);

// BULK + VIEWS
router.post('/bulk', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), enforceClassScope, resultController.bulkCreateResults);
router.get('/modules/:moduleId', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), resultController.getModuleResults);
router.get('/students/:studentId', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), resultController.getStudentResults);

// SINGLE RESULT
router.post('/', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), enforceClassScope, resultController.createResult);
router.get('/', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), resultController.getResults);
router.patch('/:id/release', requireRoles('super_admin', 'department_admin'), requirePermission('release_results'), resultReleaseController.releaseResult);
router.patch('/:id/unrelease', requireRoles('super_admin', 'department_admin'), requirePermission('release_results'), resultReleaseController.unreleaseResult);
router.get('/:id', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), resultController.getResult);
router.patch('/:id', requireRoles('super_admin', 'department_admin', 'class_admin'), requirePermission('manage_results'), enforceClassScope, resultController.updateResult);
router.delete('/:id', requireRoles('super_admin', 'department_admin'), requirePermission('manage_results'), resultController.deleteResult);

module.exports = router;