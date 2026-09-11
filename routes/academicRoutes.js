const express = require('express');
const router = express.Router();
const {
  // College
  createCollege,
  getColleges,
  getCollege,
  updateCollege,
  deleteCollege,

  // Department
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,

  // Academic Level
  createAcademicLevel,
  getAcademicLevels,
  getAcademicLevel,
  updateAcademicLevel,
  deleteAcademicLevel,

  // Academic Period
  createAcademicPeriod,
  getAcademicPeriods,
  getAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod,

  // Class
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,

  // Module
  createModule,
  getModules,
  getModule,
  updateModule,
  deleteModule,

  // Subject
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/academicController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// All academic routes require authentication and admin privileges
router.use(protect, adminOnly);

// College routes
router.post('/colleges', createCollege);
router.get('/colleges', getColleges);
router.get('/colleges/:id', getCollege);
router.patch('/colleges/:id', updateCollege);
router.delete('/colleges/:id', deleteCollege);

// Department routes
router.post('/departments', createDepartment);
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartment);
router.patch('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Academic Level routes
router.post('/academic-levels', createAcademicLevel);
router.get('/academic-levels', getAcademicLevels);
router.get('/academic-levels/:id', getAcademicLevel);
router.patch('/academic-levels/:id', updateAcademicLevel);
router.delete('/academic-levels/:id', deleteAcademicLevel);

// Academic Period routes
router.post('/academic-periods', createAcademicPeriod);
router.get('/academic-periods', getAcademicPeriods);
router.get('/academic-periods/:id', getAcademicPeriod);
router.patch('/academic-periods/:id', updateAcademicPeriod);
router.delete('/academic-periods/:id', deleteAcademicPeriod);

// Class routes
router.post('/classes', createClass);
router.get('/classes', getClasses);
router.get('/classes/:id', getClass);
router.patch('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Module routes
router.post('/modules', createModule);
router.get('/modules', getModules);
router.get('/modules/:id', getModule);
router.patch('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);

// Subject routes
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubject);
router.patch('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

module.exports = router;