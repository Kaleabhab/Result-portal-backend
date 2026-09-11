/**
 * ReExamService
 * 
 * Responsibility: Handle re-examination attempts
 * 
 * IMPORTANT: Re-exam is NOT a correction.
 * - Original result is PRESERVED
 * - New attempt is created as a separate Result record
 */

const Result = require('../../models/Result/Result');
const ModuleResult = require('../../models/Result/ModuleResult');
const ProgressionRecord = require('../../models/Result/ProgressionRecord');
const Student = require('../../models/Student');
const Module = require('../../models/Academic/Module');
const resultCalculationService = require('./resultCalculationService');
const gradingService = require('./gradingService');
const resultValidationService = require('./resultValidationService');

/**
 * Get the next attempt number for a student+module+component
 */
const getNextAttemptNumber = async (studentId, moduleId, componentId, attemptType) => {
  const lastAttempt = await Result.findOne({
    studentId,
    moduleId,
    componentId,
    attemptType
  }).sort({ attemptNumber: -1 });

  return lastAttempt ? lastAttempt.attemptNumber + 1 : 1;
};

/**
 * Create a re-exam attempt
 * The original result is preserved
 */
const createReExamAttempt = async (data) => {
  const {
    originalResultId,
    score,
    maxScore,
    uploadedBy,
    notes
  } = data;

  // 1. Find original result
  const originalResult = await Result.findById(originalResultId);
  if (!originalResult) {
    throw new Error(`Original result not found: ${originalResultId}`);
  }

  // 2. Validate original is an ORIGINAL attempt
  if (originalResult.attemptType !== 'ORIGINAL') {
    throw new Error('Can only create re-exam from an ORIGINAL result');
  }

  // 3. Validate score
  resultValidationService.validateScore(score, maxScore);

  // 4. Get next attempt number
  const nextAttemptNumber = await getNextAttemptNumber(
    originalResult.studentId,
    originalResult.moduleId,
    originalResult.componentId,
    'RE_EXAM'
  );

  // 5. Create the new re-exam result
  const reExamResult = await Result.create({
    studentId: originalResult.studentId,
    studentIdentifier: originalResult.studentIdentifier,
    academicLevelId: originalResult.academicLevelId,
    academicPeriodId: originalResult.academicPeriodId,
    moduleId: originalResult.moduleId,
    cohortId: originalResult.cohortId,
    componentId: originalResult.componentId,
    componentType: originalResult.componentType,
    componentName: originalResult.componentName,
    score,
    maxScore,
    componentWeight: originalResult.componentWeight,
    attemptType: 'RE_EXAM',
    attemptNumber: nextAttemptNumber,
    uploadedBy,
    notes: notes || `Re-exam attempt #${nextAttemptNumber}`
  });

  return {
    originalResult,
    reExamResult
  };
};

/**
 * Get best attempt for a component
 * (Typically the re-exam result replaces the original for progression purposes)
 */
const getBestAttempt = async (studentId, moduleId, componentId) => {
  const attempts = await Result.find({
    studentId,
    moduleId,
    componentId
  }).sort({ attemptNumber: -1 });

  if (attempts.length === 0) {
    return null;
  }

  // Return the latest attempt (re-exam takes precedence)
  return attempts[0];
};

/**
 * Get all attempts for a component
 */
const getAllAttempts = async (studentId, moduleId, componentId) => {
  return await Result.find({
    studentId,
    moduleId,
    componentId
  }).sort({ attemptNumber: 1 });
};

/**
 * Process re-exam result and recalculate module
 */
const processReExam = async (data) => {
  const { originalResultId, score, maxScore, uploadedBy, notes } = data;

  // 1. Create re-exam attempt
  const { originalResult, reExamResult } = await createReExamAttempt({
    originalResultId,
    score,
    maxScore,
    uploadedBy,
    notes
  });

  // 2. Get all components for this module
  const module = await Module.findById(originalResult.moduleId);
  if (!module) {
    throw new Error(`Module not found: ${originalResult.moduleId}`);
  }

  // 3. Determine which components to use (prefer re-exam for this component)
  const allComponents = await getModuleComponentsForCalculation(
    originalResult.studentId,
    originalResult.moduleId
  );

  // 4. Recalculate module result with new attempt
  const moduleResult = await recalculateModuleResult({
    studentId: originalResult.studentId,
    moduleId: originalResult.moduleId,
    academicLevelId: originalResult.academicLevelId,
    academicPeriodId: originalResult.academicPeriodId,
    cohortId: originalResult.cohortId,
    studentIdentifier: originalResult.studentIdentifier,
    components: allComponents,
    attemptType: 'RE_EXAM',
    attemptNumber: 1, // Module-level re-exam attempt
    calculatedBy: uploadedBy
  });

  return {
    originalResult,
    reExamResult,
    moduleResult
  };
};

/**
 * Helper: Get all components for a module result calculation
 * Uses the best attempt for each component
 */
const getModuleComponentsForCalculation = async (studentId, moduleId) => {
  const module = await Module.findById(moduleId);
  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  let allComponents;

  if (module.deliveryModel === 'SYSTEM_BASED') {
    const Subject = require('../../models/Academic/Subject');
    allComponents = await Subject.find({ moduleId, isActive: true });
  } else {
    const AssessmentComponent = require('../../models/Academic/AssessmentComponent');
    allComponents = await AssessmentComponent.find({ moduleId, isActive: true });
  }

  // For each component, get the best attempt
  const componentsWithScores = [];

  for (const component of allComponents) {
    const attempts = await Result.find({
      studentId,
      moduleId,
      componentId: component._id
    }).sort({ attemptNumber: -1 });

    if (attempts.length === 0) {
      throw new Error(
        `Missing result for component "${component.name}" (${component.code})`
      );
    }

    // Use latest attempt (re-exam replaces original)
    const latest = attempts[0];

    componentsWithScores.push({
      componentId: component._id,
      componentType: module.deliveryModel === 'SYSTEM_BASED' ? 'SUBJECT' : 'ASSESSMENT_COMPONENT',
      name: component.name,
      score: latest.score,
      maxScore: latest.maxScore,
      weight: component.weight
    });
  }

  return componentsWithScores;
};

/**
 * Helper: Recalculate module result
 */
const recalculateModuleResult = async (data) => {
  const {
    studentId,
    studentIdentifier,
    moduleId,
    academicLevelId,
    academicPeriodId,
    cohortId,
    components,
    attemptType,
    attemptNumber,
    calculatedBy
  } = data;

  // 1. Calculate module percentage
  const calculation = resultCalculationService.calculateModuleResult(components);

  // 2. Get module + department for grading
  const module = await Module.findById(moduleId);
  const AcademicPeriod = require('../../models/Academic/AcademicPeriod');
  const AcademicLevel = require('../../models/Academic/AcademicLevel');
  const Department = require('../../models/Academic/Department');

  const period = await AcademicPeriod.findById(academicPeriodId);
  const level = await AcademicLevel.findById(academicLevelId);
  const department = level ? await Department.findById(level.departmentId) : null;

  // 3. Grade
  const gradingModel = department?.gradingModel || 'GPA';
  const grading = gradingService.calculateGrade(calculation.percentage, gradingModel);

  // 4. Upsert ModuleResult
  const moduleResult = await ModuleResult.findOneAndUpdate(
    {
      studentId,
      moduleId,
      attemptType,
      attemptNumber
    },
    {
      studentId,
      studentIdentifier,
      moduleId,
      moduleName: module.name,
      academicLevelId,
      academicPeriodId,
      cohortId,
      percentage: calculation.percentage,
      grade: grading.grade,
      gradePoint: grading.gradePoint,
      attemptType,
      attemptNumber,
      componentSnapshot: calculation.componentSnapshot,
      calculatedBy,
      calculatedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true }
  );

  return moduleResult;
};

module.exports = {
  getNextAttemptNumber,
  createReExamAttempt,
  getBestAttempt,
  getAllAttempts,
  processReExam,
  getModuleComponentsForCalculation,
  recalculateModuleResult
};