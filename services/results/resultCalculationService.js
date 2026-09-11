/**
 * ResultCalculationService
 * 
 * Responsibility: Calculate percentages, contributions, and module results
 * 
 * This service does NOT:
 * - Validate academic context (that's ResultValidationService)
 * - Assign grades (that's GradingService)
 * - Determine progression (that's ProgressionService)
 */

/**
 * Calculate percentage from score and maxScore
 * @param {number} score
 * @param {number} maxScore
 * @returns {number} percentage (0-100)
 */
const calculatePercentage = (score, maxScore) => {
  if (typeof score !== 'number' || typeof maxScore !== 'number') {
    throw new Error('Score and maxScore must be numbers');
  }
  if (maxScore <= 0) {
    throw new Error('Max score must be greater than 0');
  }
  if (score < 0 || score > maxScore) {
    throw new Error(`Score (${score}) must be between 0 and maxScore (${maxScore})`);
  }

  const percentage = (score / maxScore) * 100;
  return Number(percentage.toFixed(4));
};

/**
 * Calculate contribution to module
 * @param {number} percentage
 * @param {number} weight
 * @returns {number} contribution
 */
const calculateContribution = (percentage, weight) => {
  if (typeof percentage !== 'number' || typeof weight !== 'number') {
    throw new Error('Percentage and weight must be numbers');
  }
  if (weight < 0 || weight > 100) {
    throw new Error(`Weight (${weight}) must be between 0 and 100`);
  }

  const contribution = (percentage * weight) / 100;
  return Number(contribution.toFixed(4));
};

/**
 * Calculate module percentage from components
 * @param {Array} components - [{ score, maxScore, weight, name }]
 * @returns {object} { modulePercentage, componentBreakdown }
 */
const calculateModulePercentage = (components) => {
  if (!Array.isArray(components) || components.length === 0) {
    throw new Error('Components must be a non-empty array');
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);

  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(
      `Component weights must sum to 100. Current sum: ${totalWeight}`
    );
  }

  let modulePercentage = 0;
  const componentBreakdown = [];

  for (const component of components) {
    const percentage = calculatePercentage(component.score, component.maxScore);
    const contribution = calculateContribution(percentage, component.weight);

    modulePercentage += contribution;

    componentBreakdown.push({
      componentId: component.componentId,
      componentType: component.componentType,
      componentName: component.name,
      score: component.score,
      maxScore: component.maxScore,
      percentage: Number(percentage.toFixed(2)),
      weight: component.weight,
      contribution: Number(contribution.toFixed(2))
    });
  }

  return {
    modulePercentage: Number(modulePercentage.toFixed(2)),
    componentBreakdown
  };
};

/**
 * Calculate complete module result from raw components
 * @param {Array} components
 * @returns {object}
 */
const calculateModuleResult = (components) => {
  const { modulePercentage, componentBreakdown } = calculateModulePercentage(components);

  return {
    percentage: modulePercentage,
    componentSnapshot: componentBreakdown,
    componentCount: components.length
  };
};

/**
 * Recalculate a single result's percentage & contribution
 */
const recalculateResult = (result) => {
  const percentage = calculatePercentage(result.score, result.maxScore);
  const contribution = calculateContribution(percentage, result.componentWeight);

  return {
    percentage: Number(percentage.toFixed(2)),
    contributionToModule: Number(contribution.toFixed(2))
  };
};

/**
 * Calculate GPA from module results
 * @param {Array} moduleResults - [{ gradePoint, credit }]
 * @returns {object} { gpa, totalCredits, totalPoints }
 */
const calculateGPA = (moduleResults) => {
  if (!Array.isArray(moduleResults) || moduleResults.length === 0) {
    return { gpa: 0, totalCredits: 0, totalPoints: 0 };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const mr of moduleResults) {
    const credit = mr.credit || 0;
    const gradePoint = mr.gradePoint || 0;
    totalPoints += gradePoint * credit;
    totalCredits += credit;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Number(gpa.toFixed(2)),
    totalCredits,
    totalPoints: Number(totalPoints.toFixed(2))
  };
};

/**
 * Calculate CGPA from multiple GPA records
 * @param {Array} gpaRecords - [{ gpa, totalCredits }]
 */
const calculateCGPA = (gpaRecords) => {
  if (!Array.isArray(gpaRecords) || gpaRecords.length === 0) {
    return { cgpa: 0, totalCredits: 0 };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const record of gpaRecords) {
    totalPoints += record.gpa * record.totalCredits;
    totalCredits += record.totalCredits;
  }

  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    cgpa: Number(cgpa.toFixed(2)),
    totalCredits
  };
};

module.exports = {
  calculatePercentage,
  calculateContribution,
  calculateModulePercentage,
  calculateModuleResult,
  recalculateResult,
  calculateGPA,
  calculateCGPA
};