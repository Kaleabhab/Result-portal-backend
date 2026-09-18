const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { requireScope } = require('../middleware/scopeMiddleware');

// Controllers
const {
  // College
  createCollege, getColleges, getCollege, updateCollege, deleteCollege,
  // Department
  createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment,
  // Academic Level
  createAcademicLevel, getAcademicLevels, getAcademicLevel, updateAcademicLevel, deleteAcademicLevel,
  // Academic Period
  createAcademicPeriod, getAcademicPeriods, getAcademicPeriod, updateAcademicPeriod, deleteAcademicPeriod,
  // Class
  createClass, getClasses, getClass, updateClass, deleteClass,
  // Module
  createModule, getModules, getModule, updateModule, deleteModule,
  // Subject
  createSubject, getSubjects, getSubject, updateSubject, deleteSubject
} = require('../controllers/academicController');

const cohortController = require('../controllers/academic/cohortController');
const assessmentComponentController = require('../controllers/academic/assessmentComponentController');

// ============================================================
// ALL academic routes require authentication
// ============================================================
router.use(protect);

// ============================================================
// COLLEGE — Super Admin only
// ============================================================
router.post(
  '/colleges',
  requireRoles('super_admin'),
  requirePermission('create_college'),
  createCollege
);

router.get(
  '/colleges',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getColleges
);

router.get(
  '/colleges/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getCollege
);

router.patch(
  '/colleges/:id',
  requireRoles('super_admin'),
  requirePermission('manage_college'),
  updateCollege
);

router.delete(
  '/colleges/:id',
  requireRoles('super_admin'),
  requirePermission('manage_college'),
  deleteCollege
);

// ============================================================
// DEPARTMENT — Super Admin only
// ============================================================
router.post(
  '/departments',
  requireRoles('super_admin'),
  requirePermission('create_department'),
  createDepartment
);

router.get(
  '/departments',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getDepartments
);

router.get(
  '/departments/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getDepartment
);

router.patch(
  '/departments/:id',
  requireRoles('super_admin'),
  requirePermission('manage_department'),
  updateDepartment
);

router.delete(
  '/departments/:id',
  requireRoles('super_admin'),
  requirePermission('manage_department'),
  deleteDepartment
);

// ============================================================
// ACADEMIC LEVEL — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/academic-levels',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_level'),
  requireScope('department'),
  createAcademicLevel
);

router.get(
  '/academic-levels',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getAcademicLevels
);

router.get(
  '/academic-levels/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getAcademicLevel
);

router.patch(
  '/academic-levels/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_level'),
  updateAcademicLevel
);

router.delete(
  '/academic-levels/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_level'),
  deleteAcademicLevel
);

// ============================================================
// ACADEMIC PERIOD — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/academic-periods',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_period'),
  requireScope('department'),
  createAcademicPeriod
);

router.get(
  '/academic-periods',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getAcademicPeriods
);

router.get(
  '/academic-periods/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getAcademicPeriod
);

router.patch(
  '/academic-periods/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_period'),
  updateAcademicPeriod
);

router.delete(
  '/academic-periods/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_academic_period'),
  deleteAcademicPeriod
);

// ============================================================
// CLASS — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/classes',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_class'),
  requireScope('department'),
  createClass
);

router.get(
  '/classes',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getClasses
);

router.get(
  '/classes/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getClass
);

router.patch(
  '/classes/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_class'),
  updateClass
);

router.delete(
  '/classes/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_class'),
  deleteClass
);

// ============================================================
// COHORT — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/cohorts',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_cohort'),
  requireScope('department'),
  cohortController.createCohort
);

router.get(
  '/cohorts',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  cohortController.getCohorts
);

router.get(
  '/cohorts/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  cohortController.getCohort
);

router.patch(
  '/cohorts/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_cohort'),
  cohortController.updateCohort
);

router.delete(
  '/cohorts/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_cohort'),
  cohortController.deleteCohort
);

// ============================================================
// MODULE — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/modules',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  requireScope('department'),
  createModule
);

router.get(
  '/modules',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getModules
);

router.get(
  '/modules/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getModule
);

router.patch(
  '/modules/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  updateModule
);

router.delete(
  '/modules/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  deleteModule
);

// ============================================================
// SUBJECT — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/subjects',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_subject'),
  requireScope('department'),
  createSubject
);

router.get(
  '/subjects',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getSubjects
);

router.get(
  '/subjects/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  getSubject
);

router.patch(
  '/subjects/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_subject'),
  updateSubject
);

router.delete(
  '/subjects/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_subject'),
  deleteSubject
);

// ============================================================
// ASSESSMENT COMPONENT — Department Admin (own department) + Super Admin
// ============================================================
router.post(
  '/assessment-components',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  requireScope('department'),
  assessmentComponentController.createAssessmentComponent
);

router.get(
  '/assessment-components',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  assessmentComponentController.getAssessmentComponents
);

router.get(
  '/assessment-components/:id',
  requireRoles('super_admin', 'it_admin', 'department_admin', 'registration_admin', 'class_admin'),
  assessmentComponentController.getAssessmentComponent
);

router.patch(
  '/assessment-components/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  assessmentComponentController.updateAssessmentComponent
);

router.delete(
  '/assessment-components/:id',
  requireRoles('super_admin', 'department_admin'),
  requirePermission('manage_module'),
  assessmentComponentController.deleteAssessmentComponent
);

module.exports = router;