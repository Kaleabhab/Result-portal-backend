/**
 * ResultValidationService
 * 
 * Responsibility: Validate that a result belongs where the admin says it belongs
 * 
 * Validates:
 * - Student exists
 * - Module exists
 * - Academic Level matches
 * - Academic Period matches
 * - Component belongs to module
 * - Weights are valid
 * - No duplicate attempts
 */

const Student = require('../../models/Student');
const Module = require('../../models/Academic/Module');
const AcademicLevel = require('../../models/Academic/AcademicLevel');
const AcademicPeriod = require('../../models/Academic/AcademicPeriod');
const Subject = require('../../models/Academic/Subject');
const AssessmentComponent = require('../../models/Academic/AssessmentComponent');
const Result = require('../../models/Result/Result');

/**
 * Validate student exists and is active
 */
const validateStudent = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }
  if (student.academicStatus === 'withdrawn') {
    throw new Error(`Student is withdrawn: ${student.studentId}`);
  }
  return student;
};

/**
 * Validate module exists
 */
const validateModule = async (moduleId) => {
  const module = await Module.findById(moduleId);
  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }
  if (!module.isActive) {
    throw new Error(`Module is not active: ${module.code}`);
  }
  return module;
};

/**
 * Validate module belongs to academic period
 */
const validateModuleBelongsToPeriod = async (moduleId, academicPeriodId) => {
  const module = await Module.findById(moduleId);
  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }
  if (module.academicPeriodId.toString() !== academicPeriodId.toString()) {
    throw new Error(
      `Module (${module.code}) does not belong to the specified academic period`
    );
  }
  return module;
};

/**
 * Validate academic period belongs to academic level
 */
const validatePeriodBelongsToLevel = async (academicPeriodId, academicLevelId) => {
  const period = await AcademicPeriod.findById(academicPeriodId);
  if (!period) {
    throw new Error(`Academic period not found: ${academicPeriodId}`);
  }
  if (period.academicLevelId.toString() !== academicLevelId.toString()) {
    throw new Error(
      `Academic period (${period.name}) does not belong to the specified academic level`
    );
  }
  return period;
};

/**
 * Validate student's academic level matches the context
 */
const validateStudentLevel = async (studentId, academicLevelId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }
  if (student.academicLevelId.toString() !== academicLevelId.toString()) {
    throw new Error(
      `Student (${student.studentId}) is not in the specified academic level`
    );
  }
  return student;
};

/**
 * Validate component belongs to module
 */
const validateComponent = async (moduleId, componentId, componentType) => {
  let component;

  if (componentType === 'SUBJECT') {
    component = await Subject.findById(componentId);
    if (!component) {
      throw new Error(`Subject not found: ${componentId}`);
    }
  } else if (componentType === 'ASSESSMENT_COMPONENT') {
    component = await AssessmentComponent.findById(componentId);
    if (!component) {
      throw new Error(`Assessment component not found: ${componentId}`);
    }
  } else {
    throw new Error(`Invalid component type: ${componentType}`);
  }

  if (component.moduleId.toString() !== moduleId.toString()) {
    throw new Error(
      `Component (${component.code}) does not belong to the specified module`
    );
  }

  return component;
};

/**
 * Validate score
 */
const validateScore = (score, maxScore) => {
  if (typeof score !== 'number' || score < 0) {
    throw new Error('Score must be a non-negative number');
  }
  if (typeof maxScore !== 'number' || maxScore <= 0) {
    throw new Error('Max score must be greater than 0');
  }
  if (score > maxScore) {
    throw new Error(`Score (${score}) cannot exceed max score (${maxScore})`);
  }
};

/**
 * Validate component weights sum to 100
 */
const validateWeights = (components) => {
  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(
      `Component weights must sum to 100%. Current sum: ${totalWeight}%`
    );
  }
  return true;
};

/**
 * Check for duplicate result (same student, module, component, attempt)
 */
const checkDuplicateResult = async (studentId, moduleId, componentId, attemptType, attemptNumber, excludeResultId = null) => {
  const query = {
    studentId,
    moduleId,
    componentId,
    attemptType,
    attemptNumber
  };

  if (excludeResultId) {
    query._id = { $ne: excludeResultId };
  }

  const existing = await Result.findOne(query);
  if (existing) {
    throw new Error(
      `Duplicate result: This student already has a ${attemptType} result (attempt ${attemptNumber}) for this component`
    );
  }
  return true;
};

/**
 * Full validation pipeline for result creation
 */
const validateResultCreation = async (data) => {
  const {
    studentId,
    moduleId,
    academicLevelId,
    academicPeriodId,
    componentId,
    componentType,
    score,
    maxScore,
    attemptType = 'ORIGINAL',
    attemptNumber = 1
  } = data;

  // 1. Validate student
  const student = await validateStudent(studentId);

  // 2. Validate module
  const module = await validateModule(moduleId);

  // 3. Validate module belongs to academic period
  await validateModuleBelongsToPeriod(moduleId, academicPeriodId);

  // 4. Validate period belongs to level
  await validatePeriodBelongsToLevel(academicPeriodId, academicLevelId);

  // 5. Validate student's level matches
  await validateStudentLevel(studentId, academicLevelId);

  // 6. Validate component belongs to module
  const component = await validateComponent(moduleId, componentId, componentType);

  // 7. Validate score
  validateScore(score, maxScore);

  // 8. Check duplicate
  await checkDuplicateResult(
    studentId,
    moduleId,
    componentId,
    attemptType,
    attemptNumber
  );

  return {
    student,
    module,
    component,
    validated: true
  };
};

/**
 * Validate that the module's delivery model matches the component type
 */
const validateDeliveryModel = async (moduleId, componentType) => {
  const module = await Module.findById(moduleId);
  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  if (module.deliveryModel === 'SYSTEM_BASED' && componentType !== 'SUBJECT') {
    throw new Error(
      `Module (${module.code}) is SYSTEM_BASED. It expects SUBJECT components, not ${componentType}`
    );
  }

  if (module.deliveryModel === 'ASSESSMENT_BASED' && componentType !== 'ASSESSMENT_COMPONENT') {
    throw new Error(
      `Module (${module.code}) is ASSESSMENT_BASED. It expects ASSESSMENT_COMPONENT components, not ${componentType}`
    );
  }

  return true;
};

module.exports = {
  validateStudent,
  validateModule,
  validateModuleBelongsToPeriod,
  validatePeriodBelongsToLevel,
  validateStudentLevel,
  validateComponent,
  validateScore,
  validateWeights,
  checkDuplicateResult,
  validateResultCreation,
  validateDeliveryModel
};