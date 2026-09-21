const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { classAdminOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { enforceClassScope } = require('../middleware/scopeMiddleware');
const { requireActiveApproval } = require('../middleware/approvalMiddleware');

const studentController = require('../controllers/studentController');
const resultController = require('../controllers/results/resultController');

router.use(protect);
router.use(classAdminOnly);

// STUDENTS IN OWN CLASS
router.get('/students', requirePermission('view_class_students'), studentController.getClassStudents);
router.get('/students/:studentId', requirePermission('view_class_students'), studentController.getClassStudent);

// APPROVAL STATUS
router.get('/approval-status', resultController.getMyApprovalStatus);

// RESULTS IN OWN CLASS — gated by Department Admin approval
router.post('/results', requirePermission('manage_results'), enforceClassScope, requireActiveApproval, resultController.createResult);
router.post('/results/bulk', requirePermission('manage_results'), enforceClassScope, requireActiveApproval, resultController.bulkCreateResults);
router.get('/results', requirePermission('view_class_results'), resultController.getClassResults);
router.patch('/results/:id', requirePermission('manage_results'), enforceClassScope, requireActiveApproval, resultController.updateResult);
router.delete('/results/:id', requirePermission('manage_results'), enforceClassScope, requireActiveApproval, resultController.deleteResult);

module.exports = router;