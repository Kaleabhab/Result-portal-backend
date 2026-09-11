/**
 * ProgressionService
 * 
 * Responsibility: Determine what happens to a student based on their grade
 * 
 * IMPORTANT: This service determines progression but does NOT update student placement.
 * Student placement updates belong to StudentService.
 */

const Department = require('../../models/Academic/Department');
const Module = require('../../models/Academic/Module');
const ModuleResult = require('../../models/Result/ModuleResult');
const ProgressionRecord = require('../../models/Result/ProgressionRecord');

// ========== DEFAULT PROGRESSION POLICIES ==========
const DEFAULT_POLICIES = {
  strict: {
    name: 'Strict',
    rules: {
      D: 'RE_EXAM',
      F: 'LAG',
      allowTwoDFail: false
    }
  },
  moderate: {
    name: 'Moderate',
    rules: {
      D: 'RE_EXAM',
      F: 'LAG',
      allowTwoDFail: true,
      twoDThreshold: 2
    }
  },
  flexible: {
    name: 'Flexible',
    rules: {
      D: 'RE_EXAM',
      F: 'RE_EXAM',
      allowTwoDFail: false
    }
  }
};

/**
 * Get progression policy by name
 */
const getProgressionPolicy = (policyName = 'moderate') => {
  return DEFAULT_POLICIES[policyName] || DEFAULT_POLICIES['moderate'];
};

/**
 * Determine single-module progression
 * @param {object} moduleResult
 * @param {object} module - Module model
 * @param {object} department - Department model
 * @returns {object} { outcome, reason }
 */
const determineModuleProgression = (moduleResult, module, department) => {
  const policy = getProgressionPolicy(department?.progressionPolicy || 'moderate');
  const grade = moduleResult.grade;

  // Get the rule for this grade
  const outcome = policy.rules[grade] || 'PASS';

  // Build reason
  let reason = `Grade ${grade} (${moduleResult.percentage}%)`;

  if (outcome === 'RE_EXAM') {
    reason += ` → Re-examination required (${policy.name} policy)`;
  } else if (outcome === 'LAG') {
    reason += ` → LAG (${policy.name} policy)`;
  } else if (outcome === 'PASS') {
    reason += ` → Passed`;
  }

  // Apply module-specific characteristic
  if (module?.progressionCharacteristic === 'NO_LAG' && outcome === 'LAG') {
    return {
      outcome: 'RE_EXAM',
      reason: `${reason} → Module has NO_LAG characteristic, changed to RE_EXAM`
    };
  }

  return { outcome, reason };
};

/**
 * Determine overall student progression
 * Considers all modules in the current academic period
 * @param {string} studentId
 * @param {Array} moduleResults
 * @param {object} department
 * @returns {object} { overallOutcome, moduleOutcomes, reason }
 */
const determineOverallProgression = async (studentId, moduleResults, department) => {
  if (!moduleResults || moduleResults.length === 0) {
    return {
      overallOutcome: 'PENDING',
      moduleOutcomes: [],
      reason: 'No module results available'
    };
  }

  const moduleOutcomes = [];
  let lagCount = 0;
  let reExamCount = 0;
  let dGradeCount = 0;

  for (const mr of moduleResults) {
    const module = await Module.findById(mr.moduleId);
    const progression = determineModuleProgression(mr, module, department);

    moduleOutcomes.push({
      moduleId: mr.moduleId,
      moduleName: module?.name || mr.moduleName,
      grade: mr.grade,
      percentage: mr.percentage,
      outcome: progression.outcome,
      reason: progression.reason
    });

    if (progression.outcome === 'LAG') lagCount++;
    if (progression.outcome === 'RE_EXAM') reExamCount++;
    if (mr.grade === 'D') dGradeCount++;
  }

  // Determine overall outcome
  let overallOutcome = 'PASS';
  let reason = 'All modules passed';

  // Check department policy
  const policy = getProgressionPolicy(department?.progressionPolicy || 'moderate');

  // Rule 1: Any LAG → overall LAG
  if (lagCount > 0) {
    overallOutcome = 'LAG';
    reason = `${lagCount} module(s) require LAG`;
  }
  // Rule 2: Check two D rule
  else if (policy.rules.allowTwoDFail && dGradeCount >= (policy.rules.twoDThreshold || 2)) {
    overallOutcome = 'LAG';
    reason = `${dGradeCount} D grades detected → LAG (${policy.name} policy)`;
  }
  // Rule 3: Any RE_EXAM
  else if (reExamCount > 0) {
    overallOutcome = 'RE_EXAM';
    reason = `${reExamCount} module(s) require re-examination`;
  }

  return {
    overallOutcome,
    moduleOutcomes,
    reason,
    summary: {
      totalModules: moduleResults.length,
      lagCount,
      reExamCount,
      dGradeCount,
      passCount: moduleResults.length - lagCount - reExamCount
    }
  };
};

/**
 * Create a ProgressionRecord for LAG
 * @param {object} data
 * @returns {ProgressionRecord}
 */
const createProgressionRecord = async (data) => {
  const {
    studentId,
    studentIdentifier,
    fromAcademicLevelId,
    targetAcademicLevelId,
    originalCohortId,
    targetCohortId,
    moduleId,
    moduleResultId,
    outcome,
    lagType,
    reason,
    determinedBy
  } = data;

  const record = await ProgressionRecord.create({
    studentId,
    studentIdentifier,
    fromAcademicLevelId,
    targetAcademicLevelId,
    originalCohortId,
    targetCohortId,
    moduleId,
    moduleResultId,
    outcome,
    lagType: lagType || 'NONE',
    reason,
    determinedBy,
    status: 'PENDING'
  });

  return record;
};

/**
 * Evaluate and record progression for a student
 * This is the main entry point
 */
const evaluateProgression = async (data) => {
  const {
    student,
    moduleResults,
    department,
    determinedBy
  } = data;

  const evaluation = await determineOverallProgression(
    student._id,
    moduleResults,
    department
  );

  const records = [];

  // Create progression records for LAG or RE_EXAM
  if (evaluation.overallOutcome === 'LAG') {
    const record = await createProgressionRecord({
      studentId: student._id,
      studentIdentifier: student.studentId,
      fromAcademicLevelId: student.academicLevelId,
      targetAcademicLevelId: student.academicLevelId,
      originalCohortId: student.originalCohortId,
      targetCohortId: student.currentCohortId,
      outcome: 'LAG',
      lagType: 'ONE_YEAR_LAG',
      reason: evaluation.reason,
      determinedBy
    });
    records.push(record);
  }

  return {
    ...evaluation,
    records
  };
};

/**
 * Validate progression (for re-evaluation)
 */
const isEligibleForReExam = (moduleResult) => {
  return moduleResult.grade === 'D' || moduleResult.grade === 'F';
};

module.exports = {
  DEFAULT_POLICIES,
  getProgressionPolicy,
  determineModuleProgression,
  determineOverallProgression,
  createProgressionRecord,
  evaluateProgression,
  isEligibleForReExam
};