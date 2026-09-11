/**
 * GradingService
 * 
 * Responsibility: Convert module percentage → Grade + Grade Point
 * 
 * This service handles ONLY grading.
 * It does NOT handle progression (that's ProgressionService).
 */

// ========== DEFAULT GRADING MODEL ==========
const DEFAULT_GRADING_MODEL = {
  name: 'Standard GPA',
  scale: [
    { min: 90, max: 100, grade: 'A+', gradePoint: 4.0 },
    { min: 85, max: 89.99, grade: 'A', gradePoint: 4.0 },
    { min: 80, max: 84.99, grade: 'A-', gradePoint: 3.75 },
    { min: 75, max: 79.99, grade: 'B+', gradePoint: 3.5 },
    { min: 70, max: 74.99, grade: 'B', gradePoint: 3.0 },
    { min: 65, max: 69.99, grade: 'C+', gradePoint: 2.5 },
    { min: 60, max: 64.99, grade: 'C', gradePoint: 2.0 },
    { min: 50, max: 59.99, grade: 'D', gradePoint: 1.0 },
    { min: 0, max: 49.99, grade: 'F', gradePoint: 0.0 }
  ]
};

// ========== GRADING MODELS BY TYPE ==========
const GRADING_MODELS = {
  'GPA': DEFAULT_GRADING_MODEL,
  
  'percentage': {
    name: 'Percentage Only',
    scale: [
      { min: 0, max: 100, grade: 'P', gradePoint: null }
    ]
  },

  'letter': {
    name: 'Letter Grades',
    scale: [
      { min: 90, max: 100, grade: 'A', gradePoint: null },
      { min: 80, max: 89.99, grade: 'B', gradePoint: null },
      { min: 70, max: 79.99, grade: 'C', gradePoint: null },
      { min: 60, max: 69.99, grade: 'D', gradePoint: null },
      { min: 0, max: 59.99, grade: 'F', gradePoint: null }
    ]
  },

  'pass_fail': {
    name: 'Pass / Fail',
    scale: [
      { min: 50, max: 100, grade: 'PASS', gradePoint: null },
      { min: 0, max: 49.99, grade: 'FAIL', gradePoint: null }
    ]
  }
};

/**
 * Get grading model by name
 */
const getGradingModel = (modelName = 'GPA') => {
  return GRADING_MODELS[modelName] || GRADING_MODELS['GPA'];
};

/**
 * Convert percentage to grade
 * @param {number} percentage - 0 to 100
 * @param {string} gradingModel - 'GPA', 'percentage', 'letter', 'pass_fail'
 * @returns {object} { grade, gradePoint, percentage, model }
 */
const calculateGrade = (percentage, gradingModel = 'GPA') => {
  // Validate input
  if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
    throw new Error(`Invalid percentage: ${percentage}. Must be between 0 and 100.`);
  }

  const model = getGradingModel(gradingModel);

  // Find matching grade
  const gradeEntry = model.scale.find(
    (entry) => percentage >= entry.min && percentage <= entry.max
  );

  if (!gradeEntry) {
    throw new Error(`No grade found for percentage ${percentage}`);
  }

  return {
    percentage: Number(percentage.toFixed(2)),
    grade: gradeEntry.grade,
    gradePoint: gradeEntry.gradePoint,
    model: model.name,
    modelKey: gradingModel
  };
};

/**
 * Check if grade is passing
 */
const isPassing = (grade) => {
  const failingGrades = ['F', 'FAIL'];
  return !failingGrades.includes(grade);
};

/**
 * Get all grading models
 */
const getAllGradingModels = () => {
  return Object.keys(GRADING_MODELS).map((key) => ({
    key,
    name: GRADING_MODELS[key].name,
    scale: GRADING_MODELS[key].scale
  }));
};

/**
 * Validate grading model
 */
const isValidGradingModel = (modelName) => {
  return Object.keys(GRADING_MODELS).includes(modelName);
};

module.exports = {
  DEFAULT_GRADING_MODEL,
  GRADING_MODELS,
  getGradingModel,
  calculateGrade,
  isPassing,
  getAllGradingModels,
  isValidGradingModel
};