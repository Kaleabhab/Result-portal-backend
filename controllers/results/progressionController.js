/**
 * Progression Controller
 * Handles progression evaluation, LAG records, student placement updates
 */

const Student = require('../../models/Student');
const AcademicLevel = require('../../models/Academic/AcademicLevel');
const Department = require('../../models/Academic/Department');
const Cohort = require('../../models/Academic/Cohort');
const ModuleResult = require('../../models/Result/ModuleResult');
const ProgressionRecord = require('../../models/Result/ProgressionRecord');
const progressionService = require('../../services/results/progressionService');

// ============================================================
// @desc    Evaluate progression for a student
// @route   POST /api/results/progression/evaluate
// @access  Private (Admin only)
// ============================================================
const evaluateProgression = async (req, res) => {
  try {
    const { studentId, moduleResultIds, academicLevelId, academicPeriodId } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get module results
    let query = { studentId: student._id };
    if (moduleResultIds && moduleResultIds.length > 0) {
      query._id = { $in: moduleResultIds };
    } else {
      if (academicLevelId) query.academicLevelId = academicLevelId;
      if (academicPeriodId) query.academicPeriodId = academicPeriodId;
    }

    const moduleResults = await ModuleResult.find(query);
    if (moduleResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No module results found'
      });
    }

    // Get department from student's academic level
    const level = await AcademicLevel.findById(student.academicLevelId);
    const department = level ? await Department.findById(level.departmentId) : null;

    // Evaluate
    const evaluation = await progressionService.evaluateProgression({
      student,
      moduleResults,
      department,
      determinedBy: req.user._id
    });

    // Update module results with progression status
    for (const mo of evaluation.moduleOutcomes) {
      await ModuleResult.updateOne(
        { studentId: student._id, moduleId: mo.moduleId },
        {
          progressionStatus: mo.outcome,
          progressionReason: mo.reason
        }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          displayName: student.displayName
        },
        evaluation
      }
    });
  } catch (error) {
    console.error('evaluateProgression error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to evaluate progression'
    });
  }
};

// ============================================================
// @desc    Get all progression records
// @route   GET /api/results/progression
// @access  Private (Admin only)
// ============================================================
const getProgressionRecords = async (req, res) => {
  try {
    const { studentId, outcome, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (studentId) query.studentIdentifier = studentId;
    if (outcome) query.outcome = outcome;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      ProgressionRecord.find(query)
        .populate('studentId', 'studentId displayName')
        .populate('fromAcademicLevelId', 'name code')
        .populate('targetAcademicLevelId', 'name code')
        .populate('originalCohortId', 'name code admissionYear')
        .populate('targetCohortId', 'name code admissionYear')
        .populate('determinedBy', 'displayName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      ProgressionRecord.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: records
    });
  } catch (error) {
    console.error('getProgressionRecords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progression records'
    });
  }
};

// ============================================================
// @desc    Get student progression history
// @route   GET /api/results/progression/student/:studentId
// @access  Private (Admin only)
// ============================================================
const getStudentProgression = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId })
      .populate('academicLevelId', 'name code')
      .populate('classId', 'name code')
      .populate('originalCohortId', 'name code admissionYear')
      .populate('currentCohortId', 'name code admissionYear');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const records = await ProgressionRecord.find({ studentId: student._id })
      .populate('fromAcademicLevelId', 'name code')
      .populate('targetAcademicLevelId', 'name code')
      .populate('originalCohortId', 'name code admissionYear')
      .populate('targetCohortId', 'name code admissionYear')
      .populate('determinedBy', 'displayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        progressionRecords: records
      }
    });
  } catch (error) {
    console.error('getStudentProgression error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student progression'
    });
  }
};

// ============================================================
// @desc    Apply a LAG (update student's current cohort)
// @route   POST /api/results/progression/:recordId/apply
// @access  Private (Admin only)
// ============================================================
const applyLag = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { targetCohortId, targetAcademicLevelId, notes } = req.body;

    const record = await ProgressionRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Progression record not found'
      });
    }

    if (record.status === 'APPLIED') {
      return res.status(400).json({
        success: false,
        message: 'LAG already applied'
      });
    }

    // Update student's current cohort
    const student = await Student.findById(record.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify target cohort exists if provided
    if (targetCohortId) {
      const cohort = await Cohort.findById(targetCohortId);
      if (!cohort) {
        return res.status(400).json({
          success: false,
          message: 'Target cohort not found'
        });
      }
      student.currentCohortId = targetCohortId;
      student.academicStatus = 'lagged';
    }

    if (targetAcademicLevelId) {
      student.academicLevelId = targetAcademicLevelId;
    }

    // Add to placement history
    student.placementHistory.push({
      academicLevelId: targetAcademicLevelId || student.academicLevelId,
      classId: student.classId,
      cohortId: targetCohortId || student.currentCohortId,
      reason: 'LAG',
      changedAt: new Date(),
      changedBy: req.user._id
    });

    await student.save();

    // Update record
    record.status = 'APPLIED';
    record.appliedAt = new Date();
    if (notes) record.notes = notes;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'LAG applied successfully',
      data: {
        student: {
          studentId: student.studentId,
          displayName: student.displayName,
          currentCohortId: student.currentCohortId,
          academicLevelId: student.academicLevelId,
          academicStatus: student.academicStatus
        },
        record
      }
    });
  } catch (error) {
    console.error('applyLag error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply LAG'
    });
  }
};

// ============================================================
// @desc    Update progression record status
// @route   PATCH /api/results/progression/:recordId
// @access  Private (Admin only)
// ============================================================
const updateProgressionRecord = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const record = await ProgressionRecord.findByIdAndUpdate(
      req.params.recordId,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Progression record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progression record updated',
      data: record
    });
  } catch (error) {
    console.error('updateProgressionRecord error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progression record'
    });
  }
};

module.exports = {
  evaluateProgression,
  getProgressionRecords,
  getStudentProgression,
  applyLag,
  updateProgressionRecord
};