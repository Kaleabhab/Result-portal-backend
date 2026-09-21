const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { requireScope } = require('../middleware/scopeMiddleware');

const {
  createCollege, getColleges, getCollege, updateCollege, deleteCollege,
  createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment,
  createAcademicLevel, getAcademicLevels, getAcademicLevel, updateAcademicLevel, deleteAcademicLevel,
  createAcademicPeriod, getAcademicPeriods, getAcademicPeriod, updateAcademicPeriod, deleteAcademicPeriod,
  createClass, getClasses, getClass, updateClass, deleteClass,
  createModule, getModules, getModule, updateModule, deleteModule,
  createSubject, getSubjects, getSubject, updateSubject, deleteSubject
} = require('../controllers/academicController');

const cohortController = require('../controllers/academic/cohortController');
const assessmentComponentController = require('../controllers/academic/assessmentComponentController');

const ALL_ADMINS = ['super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'];
const DEPT_WRITERS = ['super_admin', 'department_admin'];

router.use(protect);

// COLLEGES — Super Admin only write
router.post('/colleges', requireRoles('super_admin'), requirePermission('create_college'), createCollege);
router.get('/colleges', requireRoles(...ALL_ADMINS), getColleges);
router.get('/colleges/:id', requireRoles(...ALL_ADMINS), getCollege);
router.patch('/colleges/:id', requireRoles('super_admin'), requirePermission('manage_college'), updateCollege);
router.delete('/colleges/:id', requireRoles('super_admin'), requirePermission('manage_college'), deleteCollege);

// DEPARTMENTS — Super Admin only write
router.post('/departments', requireRoles('super_admin'), requirePermission('create_department'), createDepartment);
router.get('/departments', requireRoles(...ALL_ADMINS), getDepartments);
router.get('/departments/:id', requireRoles(...ALL_ADMINS), getDepartment);
router.patch('/departments/:id', requireRoles('super_admin'), requirePermission('manage_department'), updateDepartment);
router.delete('/departments/:id', requireRoles('super_admin'), requirePermission('manage_department'), deleteDepartment);

// ACADEMIC LEVELS
router.post('/academic-levels', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_level'), requireScope('department'), createAcademicLevel);
router.get('/academic-levels', requireRoles(...ALL_ADMINS), getAcademicLevels);
router.get('/academic-levels/:id', requireRoles(...ALL_ADMINS), getAcademicLevel);
router.patch('/academic-levels/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_level'), updateAcademicLevel);
router.delete('/academic-levels/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_level'), deleteAcademicLevel);

// ACADEMIC PERIODS
router.post('/academic-periods', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_period'), requireScope('department'), createAcademicPeriod);
router.get('/academic-periods', requireRoles(...ALL_ADMINS), getAcademicPeriods);
router.get('/academic-periods/:id', requireRoles(...ALL_ADMINS), getAcademicPeriod);
router.patch('/academic-periods/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_period'), updateAcademicPeriod);
router.delete('/academic-periods/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_academic_period'), deleteAcademicPeriod);

// CLASSES
router.post('/classes', requireRoles(...DEPT_WRITERS), requirePermission('manage_class'), requireScope('department'), createClass);
router.get('/classes', requireRoles(...ALL_ADMINS), getClasses);
router.get('/classes/:id', requireRoles(...ALL_ADMINS), getClass);
router.patch('/classes/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_class'), updateClass);
router.delete('/classes/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_class'), deleteClass);

// COHORTS
router.post('/cohorts', requireRoles(...DEPT_WRITERS), requirePermission('manage_cohort'), requireScope('department'), cohortController.createCohort);
router.get('/cohorts', requireRoles(...ALL_ADMINS), cohortController.getCohorts);
router.get('/cohorts/:id', requireRoles(...ALL_ADMINS), cohortController.getCohort);
router.patch('/cohorts/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_cohort'), cohortController.updateCohort);
router.delete('/cohorts/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_cohort'), cohortController.deleteCohort);

// MODULES
router.post('/modules', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), requireScope('department'), createModule);
router.get('/modules', requireRoles(...ALL_ADMINS), getModules);
router.get('/modules/:id', requireRoles(...ALL_ADMINS), getModule);
router.patch('/modules/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), updateModule);
router.delete('/modules/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), deleteModule);

// SUBJECTS
router.post('/subjects', requireRoles(...DEPT_WRITERS), requirePermission('manage_subject'), requireScope('department'), createSubject);
router.get('/subjects', requireRoles(...ALL_ADMINS), getSubjects);
router.get('/subjects/:id', requireRoles(...ALL_ADMINS), getSubject);
router.patch('/subjects/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_subject'), updateSubject);
router.delete('/subjects/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_subject'), deleteSubject);

// ASSESSMENT COMPONENTS
router.post('/assessment-components', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), requireScope('department'), assessmentComponentController.createAssessmentComponent);
router.get('/assessment-components', requireRoles(...ALL_ADMINS), assessmentComponentController.getAssessmentComponents);
router.get('/assessment-components/:id', requireRoles(...ALL_ADMINS), assessmentComponentController.getAssessmentComponent);
router.patch('/assessment-components/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), assessmentComponentController.updateAssessmentComponent);
router.delete('/assessment-components/:id', requireRoles(...DEPT_WRITERS), requirePermission('manage_module'), assessmentComponentController.deleteAssessmentComponent);

module.exports = router;