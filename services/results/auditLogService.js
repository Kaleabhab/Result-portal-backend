/**
 * AuditLogService
 * 
 * Responsibility: Log all result corrections and changes
 */

const ResultUpdateLog = require('../../models/Result/ResultUpdateLog');

/**
 * Log a result correction
 */
const logCorrection = async (data) => {
  const {
    resultId,
    studentId,
    moduleId,
    componentId,
    componentType,
    oldScore,
    newScore,
    oldMaxScore,
    newMaxScore,
    oldPercentage,
    newPercentage,
    oldContribution,
    newContribution,
    reason,
    updatedBy
  } = data;

  const log = await ResultUpdateLog.create({
    resultId,
    studentId,
    moduleId,
    componentId,
    componentType,
    updateType: 'CORRECTION',
    oldScore,
    newScore,
    oldMaxScore,
    newMaxScore,
    oldPercentage,
    newPercentage,
    oldContribution,
    newContribution,
    reason,
    updatedBy,
    updatedAt: new Date()
  });

  return log;
};

/**
 * Mark module result recalculated
 */
const markModuleResultRecalculated = async (logId) => {
  return await ResultUpdateLog.findByIdAndUpdate(
    logId,
    { moduleResultRecalculated: true },
    { new: true }
  );
};

/**
 * Mark progression re-evaluated
 */
const markProgressionReevaluated = async (logId) => {
  return await ResultUpdateLog.findByIdAndUpdate(
    logId,
    { progressionReevaluated: true },
    { new: true }
  );
};

/**
 * Get correction history for a result
 */
const getCorrectionHistory = async (resultId) => {
  return await ResultUpdateLog.find({ resultId })
    .populate('updatedBy', 'displayName email')
    .sort({ createdAt: -1 });
};

/**
 * Get all corrections for a student
 */
const getStudentCorrectionHistory = async (studentId) => {
  return await ResultUpdateLog.find({ studentId })
    .populate('updatedBy', 'displayName email')
    .populate('moduleId', 'name code')
    .sort({ createdAt: -1 });
};

module.exports = {
  logCorrection,
  markModuleResultRecalculated,
  markProgressionReevaluated,
  getCorrectionHistory,
  getStudentCorrectionHistory
};