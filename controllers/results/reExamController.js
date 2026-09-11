/**
 * Re-Exam Controller
 * Handles re-exam attempts (does NOT modify original result)
 */

const Result = require('../../models/Result/Result');
const ModuleResult = require('../../models/Result/ModuleResult');
const reExamService = require('../../services/results/reExamService');

// ============================================================
// @desc    Create re-exam attempt
// @route   POST /api/results/re-exams
// @access  Private (Admin only)
// ============================================================
const createReExam = async (req, res) => {
  try {
    const { originalResultId, score, maxScore, notes } = req.body;

    if (!originalResultId) {
      return res.status(400).json({
        success: false,
        message: 'originalResultId is required'
      });
    }

    const processed = await reExamService.processReExam({
      originalResultId,
      score,
      maxScore,
      uploadedBy: req.user._id,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Re-exam attempt created successfully',
      data: processed
    });
  } catch (error) {
    console.error('createReExam error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create re-exam'
    });
  }
};

// ============================================================
// @desc    Get all attempts for a component
// @route   GET /api/results/re-exams/attempts
// @access  Private (Admin only)
// ============================================================
const getAttempts = async (req, res) => {
  try {
    const { studentId, moduleId, componentId } = req.query;

    if (!studentId || !moduleId || !componentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId, moduleId, componentId are required'
      });
    }

    const Student = require('../../models/Student');
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const attempts = await reExamService.getAllAttempts(
      student._id,
      moduleId,
      componentId
    );

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    console.error('getAttempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attempts'
    });
  }
};

// ============================================================
// @desc    Get re-exam eligible students
// @route   GET /api/results/re-exams/eligible
// @access  Private (Admin only)
// ============================================================
const getEligibleStudents = async (req, res) => {
  try {
    const { moduleId, academicLevelId, academicPeriodId } = req.query;

    const query = {
      progressionStatus: 'RE_EXAM'
    };
    if (moduleId) query.moduleId = moduleId;
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (academicPeriodId) query.academicPeriodId = academicPeriodId;

    const moduleResults = await ModuleResult.find(query)
      .populate('studentId', 'studentId displayName email')
      .populate('moduleId', 'name code')
      .sort({ percentage: 1 });

    res.status(200).json({
      success: true,
      count: moduleResults.length,
      data: moduleResults
    });
  } catch (error) {
    console.error('getEligibleStudents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve eligible students'
    });
  }
};

module.exports = {
  createReExam,
  getAttempts,
  getEligibleStudents
};