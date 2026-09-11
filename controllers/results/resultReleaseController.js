/**
 * Result Release Controller
 */

const resultReleaseService = require('../../services/results/resultReleaseService');

// @desc    Release a single result
// @route   PATCH /api/results/:id/release
const releaseResult = async (req, res) => {
  try {
    const result = await resultReleaseService.releaseResult(
      req.params.id,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: 'Result released',
      data: result
    });
  } catch (error) {
    console.error('releaseResult error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to release result'
    });
  }
};

// @desc    Unrelease a single result
// @route   PATCH /api/results/:id/unrelease
const unreleaseResult = async (req, res) => {
  try {
    const result = await resultReleaseService.unreleaseResult(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Result unreleased',
      data: result
    });
  } catch (error) {
    console.error('unreleaseResult error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to unrelease result'
    });
  }
};

// @desc    Release all results for a module
// @route   PATCH /api/results/modules/:moduleId/release
const releaseModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { academicLevelId, academicPeriodId } = req.body;

    const summary = await resultReleaseService.releaseModule({
      moduleId,
      academicLevelId,
      academicPeriodId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Module released successfully',
      data: summary
    });
  } catch (error) {
    console.error('releaseModule error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to release module'
    });
  }
};

// @desc    Unrelease all results for a module
// @route   PATCH /api/results/modules/:moduleId/unrelease
const unreleaseModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { academicLevelId, academicPeriodId } = req.body;

    const summary = await resultReleaseService.unreleaseModule({
      moduleId,
      academicLevelId,
      academicPeriodId
    });

    res.status(200).json({
      success: true,
      message: 'Module unreleased successfully',
      data: summary
    });
  } catch (error) {
    console.error('unreleaseModule error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to unrelease module'
    });
  }
};

// @desc    Get module release status
// @route   GET /api/results/modules/:moduleId/release-status
const getReleaseStatus = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { academicLevelId, academicPeriodId } = req.query;

    const status = await resultReleaseService.getModuleReleaseStatus({
      moduleId,
      academicLevelId,
      academicPeriodId
    });

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('getReleaseStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve release status'
    });
  }
};

module.exports = {
  releaseResult,
  unreleaseResult,
  releaseModule,
  unreleaseModule,
  getReleaseStatus
};