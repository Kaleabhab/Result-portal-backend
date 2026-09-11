const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { adminOnly, studentOnly } = require('../middleware/roleMiddleware');

const resultController = require('../controllers/results/resultController');
const reExamController = require('../controllers/results/reExamController');
const progressionController = require('../controllers/results/progressionController');
const resultReleaseController = require('../controllers/results/resultReleaseController');

// ============================================================
// STUDENT SELF-SERVICE (must come before /:id)
// ============================================================
router.get('/student/me', protect, studentOnly, resultController.getMyResults);
router.get('/student/me/modules', protect, studentOnly, resultController.getMyModuleResults);

// ============================================================
// RE-EXAMS
// ============================================================
router.post('/re-exams', protect, adminOnly, reExamController.createReExam);
router.get('/re-exams/attempts', protect, adminOnly, reExamController.getAttempts);
router.get('/re-exams/eligible', protect, adminOnly, reExamController.getEligibleStudents);

// ============================================================
// PROGRESSION
// ============================================================
router.post('/progression/evaluate', protect, adminOnly, progressionController.evaluateProgression);
router.get('/progression', protect, adminOnly, progressionController.getProgressionRecords);
router.get('/progression/student/:studentId', protect, adminOnly, progressionController.getStudentProgression);
router.post('/progression/:recordId/apply', protect, adminOnly, progressionController.applyLag);
router.patch('/progression/:recordId', protect, adminOnly, progressionController.updateProgressionRecord);

// ============================================================
// RELEASE
// ============================================================
router.patch('/modules/:moduleId/release', protect, adminOnly, resultReleaseController.releaseModule);
router.patch('/modules/:moduleId/unrelease', protect, adminOnly, resultReleaseController.unreleaseModule);
router.get('/modules/:moduleId/release-status', protect, adminOnly, resultReleaseController.getReleaseStatus);

// ============================================================
// BULK + MODULE VIEWS
// ============================================================
router.post('/bulk', protect, adminOnly, resultController.bulkCreateResults);
router.get('/modules/:moduleId', protect, adminOnly, resultController.getModuleResults);
router.get('/students/:studentId', protect, adminOnly, resultController.getStudentResults);

// ============================================================
// SINGLE RESULT
// ============================================================
router.post('/', protect, adminOnly, resultController.createResult);
router.get('/', protect, adminOnly, resultController.getResults);

router.patch('/:id/release', protect, adminOnly, resultReleaseController.releaseResult);
router.patch('/:id/unrelease', protect, adminOnly, resultReleaseController.unreleaseResult);

router.get('/:id', protect, adminOnly, resultController.getResult);
router.patch('/:id', protect, adminOnly, resultController.updateResult);
router.delete('/:id', protect, adminOnly, resultController.deleteResult);

module.exports = router;