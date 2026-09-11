/**
 * ResultReleaseService
 * 
 * Responsibility: Handle result release/unrelease
 * 
 * Rules:
 * - Results start as released: false
 * - Only released results are visible to students
 * - Release happens at the module level
 */

const Result = require('../../models/Result/Result');
const ModuleResult = require('../../models/Result/ModuleResult');

/**
 * Release a single result
 */
const releaseResult = async (resultId, userId) => {
  const result = await Result.findById(resultId);
  if (!result) {
    throw new Error(`Result not found: ${resultId}`);
  }

  result.released = true;
  result.releasedAt = new Date();
  result.releasedBy = userId;
  await result.save();

  return result;
};

/**
 * Unrelease a single result
 */
const unreleaseResult = async (resultId) => {
  const result = await Result.findById(resultId);
  if (!result) {
    throw new Error(`Result not found: ${resultId}`);
  }

  result.released = false;
  result.releasedAt = undefined;
  result.releasedBy = undefined;
  await result.save();

  return result;
};

/**
 * Release all results for a module + academic period + level
 * Verifies completeness before releasing
 */
const releaseModule = async (data) => {
  const { moduleId, academicLevelId, academicPeriodId, userId } = data;

  // 1. Get all ModuleResults for this module
  const moduleResults = await ModuleResult.find({
    moduleId,
    academicLevelId,
    academicPeriodId
  });

  if (moduleResults.length === 0) {
    throw new Error('No module results found to release');
  }

  // 2. Release each ModuleResult
  const releasedAt = new Date();
  for (const mr of moduleResults) {
    mr.released = true;
    mr.releasedAt = releasedAt;
    mr.releasedBy = userId;
    await mr.save();
  }

  // 3. Release all component Results for this module
  const results = await Result.find({
    moduleId,
    academicLevelId,
    academicPeriodId
  });

  for (const result of results) {
    result.released = true;
    result.releasedAt = releasedAt;
    result.releasedBy = userId;
    await result.save();
  }

  return {
    moduleResultsReleased: moduleResults.length,
    componentResultsReleased: results.length,
    releasedAt
  };
};

/**
 * Unrelease entire module
 */
const unreleaseModule = async (data) => {
  const { moduleId, academicLevelId, academicPeriodId } = data;

  const moduleResults = await ModuleResult.updateMany(
    { moduleId, academicLevelId, academicPeriodId },
    { released: false, releasedAt: null, releasedBy: null }
  );

  const results = await Result.updateMany(
    { moduleId, academicLevelId, academicPeriodId },
    { released: false, releasedAt: null, releasedBy: null }
  );

  return {
    moduleResultsUnreleased: moduleResults.modifiedCount,
    componentResultsUnreleased: results.modifiedCount
  };
};

/**
 * Get release status for a module
 */
const getModuleReleaseStatus = async (data) => {
  const { moduleId, academicLevelId, academicPeriodId } = data;

  const totalResults = await Result.countDocuments({
    moduleId,
    academicLevelId,
    academicPeriodId
  });

  const releasedResults = await Result.countDocuments({
    moduleId,
    academicLevelId,
    academicPeriodId,
    released: true
  });

  const totalModuleResults = await ModuleResult.countDocuments({
    moduleId,
    academicLevelId,
    academicPeriodId
  });

  const releasedModuleResults = await ModuleResult.countDocuments({
    moduleId,
    academicLevelId,
    academicPeriodId,
    released: true
  });

  return {
    componentResults: {
      total: totalResults,
      released: releasedResults,
      pending: totalResults - releasedResults,
      complete: totalResults > 0 && totalResults === releasedResults
    },
    moduleResults: {
      total: totalModuleResults,
      released: releasedModuleResults,
      pending: totalModuleResults - releasedModuleResults,
      complete: totalModuleResults > 0 && totalModuleResults === releasedModuleResults
    }
  };
};

module.exports = {
  releaseResult,
  unreleaseResult,
  releaseModule,
  unreleaseModule,
  getModuleReleaseStatus
};