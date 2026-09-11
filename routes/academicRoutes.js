const express = require('express');
const router = express.Router();

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

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect, adminOnly);

// COLLEGE
router.post('/colleges', createCollege);
router.get('/colleges', getColleges);
router.get('/colleges/:id', getCollege);
router.patch('/colleges/:id', updateCollege);
router.delete('/colleges/:id', deleteCollege);

// DEPARTMENT
router.post('/departments', createDepartment);
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartment);
router.patch('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// ACADEMIC LEVEL
router.post('/academic-levels', createAcademicLevel);
router.get('/academic-levels', getAcademicLevels);
router.get('/academic-levels/:id', getAcademicLevel);
router.patch('/academic-levels/:id', updateAcademicLevel);
router.delete('/academic-levels/:id', deleteAcademicLevel);

// ACADEMIC PERIOD
router.post('/academic-periods', createAcademicPeriod);
router.get('/academic-periods', getAcademicPeriods);
router.get('/academic-periods/:id', getAcademicPeriod);
router.patch('/academic-periods/:id', updateAcademicPeriod);
router.delete('/academic-periods/:id', deleteAcademicPeriod);

// CLASS
router.post('/classes', createClass);
router.get('/classes', getClasses);
router.get('/classes/:id', getClass);
router.patch('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// COHORT (NEW)
router.post('/cohorts', cohortController.createCohort);
router.get('/cohorts', cohortController.getCohorts);
router.get('/cohorts/:id', cohortController.getCohort);
router.patch('/cohorts/:id', cohortController.updateCohort);
router.delete('/cohorts/:id', cohortController.deleteCohort);

// MODULE
router.post('/modules', createModule);
router.get('/modules', getModules);
router.get('/modules/:id', getModule);
router.patch('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);

// SUBJECT
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubject);
router.patch('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// ASSESSMENT COMPONENT (NEW)
router.post('/assessment-components', assessmentComponentController.createAssessmentComponent);
router.get('/assessment-components', assessmentComponentController.getAssessmentComponents);
router.get('/assessment-components/:id', assessmentComponentController.getAssessmentComponent);
router.patch('/assessment-components/:id', assessmentComponentController.updateAssessmentComponent);
router.delete('/assessment-components/:id', assessmentComponentController.deleteAssessmentComponent);

module.exports = router;