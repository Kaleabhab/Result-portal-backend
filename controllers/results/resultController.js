/**
 * Result Controller
 * Handles: manual entry, bulk upload, viewing, correction
 */

const Result = require('../../models/Result/Result');
const ModuleResult = require('../../models/Result/ModuleResult');
const Student = require('../../models/Student');
const Module = require('../../models/Academic/Module');
const AcademicLevel = require('../../models/Academic/AcademicLevel');
const AcademicPeriod = require('../../models/Academic/AcademicPeriod');
const Department = require('../../models/Academic/Department');
const Subject = require('../../models/Academic/Subject');
const AssessmentComponent = require('../../models/Academic/AssessmentComponent');

const resultValidationService = require('../../services/results/resultValidationService');
const resultCalculationService = require('../../services/results/resultCalculationService');
const gradingService = require('../../services/results/gradingService');
const auditLogService = require('../../services/results/auditLogService');
const reExamService = require('../../services/results/reExamService');

// ============================================================
// @desc    Create a single result
// @route   POST /api/results
// @access  Private (Admin only)
// ============================================================
const createResult = async (req, res) => {
  try {
    const {
      studentId,
      moduleId,
      academicLevelId,
      academicPeriodId,
      componentId,
      componentType,
      score,
      maxScore,
      attemptType,
      attemptNumber,
      notes
    } = req.body;

    // Full validation pipeline
    const validated = await resultValidationService.validateResultCreation({
      studentId,
      moduleId,
      academicLevelId,
      academicPeriodId,
      componentId,
      componentType,
      score,
      maxScore,
      attemptType: attemptType || 'ORIGINAL',
      attemptNumber: attemptNumber || 1
    });

    // Validate delivery model matches component type
    await resultValidationService.validateDeliveryModel(moduleId, componentType);

    // Calculate percentage & contribution
    const calc = resultCalculationService.recalculateResult({
      score,
      maxScore,
      componentWeight: validated.component.weight
    });

    // Create result
    const result = await Result.create({
      studentId: validated.student._id,
      studentIdentifier: validated.student.studentId,
      academicLevelId,
      academicPeriodId,
      moduleId,
      cohortId: validated.student.currentCohortId,
      componentId,
      componentType,
      componentName: validated.component.name,
      score,
      maxScore,
      percentage: calc.percentage,
      componentWeight: validated.component.weight,
      contributionToModule: calc.contributionToModule,
      attemptType: attemptType || 'ORIGINAL',
      attemptNumber: attemptNumber || 1,
      uploadedBy: req.user._id,
      notes: notes || ''
    });

    // Check if all components have results → auto-recalculate ModuleResult
    await tryRecalculateModuleResult(studentId, moduleId, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: result
    });
  } catch (error) {
    console.error('createResult error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create result'
    });
  }
};

// ============================================================
// @desc    Bulk create results
// @route   POST /api/results/bulk
// @access  Private (Admin only)
// ============================================================
const bulkCreateResults = async (req, res) => {
  try {
    const {
      moduleId,
      academicLevelId,
      academicPeriodId,
      componentId,
      componentType,
      results // [{ studentIdentifier, score, maxScore }]
    } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'results array is required and must not be empty'
      });
    }

    // Validate module
    const module = await resultValidationService.validateModule(moduleId);
    await resultValidationService.validateModuleBelongsToPeriod(moduleId, academicPeriodId);
    await resultValidationService.validatePeriodBelongsToLevel(academicPeriodId, academicLevelId);
    await resultValidationService.validateDeliveryModel(moduleId, componentType);

    const component = await resultValidationService.validateComponent(
      moduleId,
      componentId,
      componentType
    );

    const summary = {
      total: results.length,
      successful: 0,
      failed: 0,
      errors: [],
      created: []
    };

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 1;

      try {
        // Find student
        const student = await Student.findOne({ studentId: row.studentIdentifier });
        if (!student) {
          summary.errors.push({ row: rowNumber, error: `Student not found: ${row.studentIdentifier}` });
          summary.failed++;
          continue;
        }

        // Validate score
        resultValidationService.validateScore(row.score, row.maxScore);

        // Check duplicate
        await resultValidationService.checkDuplicateResult(
          student._id,
          moduleId,
          componentId,
          'ORIGINAL',
          1
        );

        // Calculate
        const calc = resultCalculationService.recalculateResult({
          score: row.score,
          maxScore: row.maxScore,
          componentWeight: component.weight
        });

        // Create
        const result = await Result.create({
          studentId: student._id,
          studentIdentifier: student.studentId,
          academicLevelId,
          academicPeriodId,
          moduleId,
          cohortId: student.currentCohortId,
          componentId,
          componentType,
          componentName: component.name,
          score: row.score,
          maxScore: row.maxScore,
          percentage: calc.percentage,
          componentWeight: component.weight,
          contributionToModule: calc.contributionToModule,
          attemptType: 'ORIGINAL',
          attemptNumber: 1,
          uploadedBy: req.user._id
        });

        summary.successful++;
        summary.created.push({
          studentIdentifier: student.studentId,
          score: row.score,
          maxScore: row.maxScore,
          percentage: calc.percentage
        });
      } catch (err) {
        summary.errors.push({ row: rowNumber, error: err.message });
        summary.failed++;
      }
    }

    // Try to recalculate module result for all affected students
    const affectedStudents = summary.created.map((c) => c.studentIdentifier);
    for (const sid of affectedStudents) {
      const s = await Student.findOne({ studentId: sid });
      if (s) await tryRecalculateModuleResult(s._id, moduleId, req.user._id);
    }

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      summary
    });
  } catch (error) {
    console.error('bulkCreateResults error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Bulk upload failed'
    });
  }
};

// ============================================================
// @desc    Get all results (admin)
// @route   GET /api/results
// @access  Private (Admin only)
// ============================================================
const getResults = async (req, res) => {
  try {
    const {
      studentId,
      moduleId,
      componentId,
      academicLevelId,
      academicPeriodId,
      attemptType,
      released,
      page = 1,
      limit = 100
    } = req.query;

    const query = {};
    if (studentId) query.studentIdentifier = studentId;
    if (moduleId) query.moduleId = moduleId;
    if (componentId) query.componentId = componentId;
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (academicPeriodId) query.academicPeriodId = academicPeriodId;
    if (attemptType) query.attemptType = attemptType;
    if (released !== undefined) query.released = released === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Result.find(query)
        .populate('studentId', 'studentId displayName')
        .populate('moduleId', 'name code')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Result.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: results
    });
  } catch (error) {
    console.error('getResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve results'
    });
  }
};

// ============================================================
// @desc    Get single result
// @route   GET /api/results/:id
// @access  Private (Admin only)
// ============================================================
const getResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'studentId displayName email')
      .populate('moduleId', 'name code')
      .populate('academicLevelId', 'name code')
      .populate('academicPeriodId', 'name code')
      .populate('uploadedBy', 'displayName email');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Attach correction history
    const history = await auditLogService.getCorrectionHistory(result._id);

    res.status(200).json({
      success: true,
      data: {
        ...result.toJSON(),
        correctionHistory: history
      }
    });
  } catch (error) {
    console.error('getResult error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve result'
    });
  }
};

// ============================================================
// @desc    Get my results (student - only released)
// @route   GET /api/results/student/me
// @access  Private (Student only)
// ============================================================
const getMyResults = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const moduleResults = await ModuleResult.find({
      studentId: student._id,
      released: true
    })
      .populate('moduleId', 'name code credit deliveryModel category')
      .populate('academicLevelId', 'name code')
      .populate('academicPeriodId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: moduleResults.length,
      data: moduleResults
    });
  } catch (error) {
    console.error('getMyResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve results'
    });
  }
};

// ============================================================
// @desc    Get my module results with component breakdown
// @route   GET /api/results/student/me/modules
// @access  Private (Student only)
// ============================================================
const getMyModuleResults = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const moduleResults = await ModuleResult.find({
      studentId: student._id,
      released: true
    })
      .populate('moduleId', 'name code credit deliveryModel category')
      .populate('academicLevelId', 'name code')
      .populate('academicPeriodId', 'name code')
      .sort({ createdAt: -1 });

    const detailed = await Promise.all(
      moduleResults.map(async (mr) => {
        const components = await Result.find({
          studentId: student._id,
          moduleId: mr.moduleId._id,
          released: true
        }).populate('componentId', 'name code weight');

        return {
          ...mr.toJSON(),
          components
        };
      })
    );

    res.status(200).json({
      success: true,
      count: detailed.length,
      data: detailed
    });
  } catch (error) {
    console.error('getMyModuleResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve module results'
    });
  }
};

// ============================================================
// @desc    Get results for a module (admin)
// @route   GET /api/results/modules/:moduleId
// @access  Private (Admin only)
// ============================================================
const getModuleResults = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { academicLevelId, academicPeriodId, released } = req.query;

    const query = { moduleId };
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (academicPeriodId) query.academicPeriodId = academicPeriodId;
    if (released !== undefined) query.released = released === 'true';

    const moduleResults = await ModuleResult.find(query)
      .populate('studentId', 'studentId displayName')
      .populate('moduleId', 'name code')
      .sort({ percentage: -1 });

    res.status(200).json({
      success: true,
      count: moduleResults.length,
      data: moduleResults
    });
  } catch (error) {
    console.error('getModuleResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve module results'
    });
  }
};

// ============================================================
// @desc    Get student results (admin)
// @route   GET /api/results/students/:studentId
// @access  Private (Admin only)
// ============================================================
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const [results, moduleResults] = await Promise.all([
      Result.find({ studentId: student._id })
        .populate('moduleId', 'name code')
        .populate('componentId', 'name code')
        .sort({ createdAt: -1 }),
      ModuleResult.find({ studentId: student._id })
        .populate('moduleId', 'name code credit')
        .populate('academicLevelId', 'name code')
        .populate('academicPeriodId', 'name code')
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          displayName: student.displayName
        },
        componentResults: results,
        moduleResults
      }
    });
  } catch (error) {
    console.error('getStudentResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student results'
    });
  }
};

// ============================================================
// @desc    Update result (correction)
// @route   PATCH /api/results/:id
// @access  Private (Admin only)
// ============================================================
const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, maxScore, reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for correction is required'
      });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Store old values
    const oldValues = {
      oldScore: result.score,
      newScore: score !== undefined ? score : result.score,
      oldMaxScore: result.maxScore,
      newMaxScore: maxScore !== undefined ? maxScore : result.maxScore,
      oldPercentage: result.percentage,
      newPercentage: null,
      oldContribution: result.contributionToModule,
      newContribution: null
    };

    // Update score
    if (score !== undefined) result.score = score;
    if (maxScore !== undefined) result.maxScore = maxScore;

    // Recalculate
    const calc = resultCalculationService.recalculateResult({
      score: result.score,
      maxScore: result.maxScore,
      componentWeight: result.componentWeight
    });

    oldValues.newPercentage = calc.percentage;
    oldValues.newContribution = calc.contributionToModule;

    result.percentage = calc.percentage;
    result.contributionToModule = calc.contributionToModule;
    await result.save();

    // Log correction
    const log = await auditLogService.logCorrection({
      resultId: result._id,
      studentId: result.studentId,
      moduleId: result.moduleId,
      componentId: result.componentId,
      componentType: result.componentType,
      ...oldValues,
      reason,
      updatedBy: req.user._id
    });

    // Recalculate module result
    const moduleResult = await tryRecalculateModuleResult(
      result.studentId,
      result.moduleId,
      req.user._id
    );

    // Mark log
    await auditLogService.markModuleResultRecalculated(log._id);

    res.status(200).json({
      success: true,
      message: 'Result corrected successfully',
      data: {
        result,
        moduleResult,
        log
      }
    });
  } catch (error) {
    console.error('updateResult error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update result'
    });
  }
};

// ============================================================
// @desc    Delete a result (admin, unreleased only)
// @route   DELETE /api/results/:id
// @access  Private (Admin only)
// ============================================================
const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.released) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a released result. Unrelease it first.'
      });
    }

    await Result.findByIdAndDelete(req.params.id);

    // Try recalculate module result
    await tryRecalculateModuleResult(
      result.studentId,
      result.moduleId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('deleteResult error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete result'
    });
  }
};

// ============================================================
// HELPER: Try to recalculate ModuleResult if all components exist
// ============================================================
const tryRecalculateModuleResult = async (studentId, moduleId, userId) => {
  try {
    const module = await Module.findById(moduleId);
    if (!module) return null;

    // Get all components
    let allComponents;
    if (module.deliveryModel === 'SYSTEM_BASED') {
      allComponents = await Subject.find({ moduleId, isActive: true });
    } else {
      allComponents = await AssessmentComponent.find({ moduleId, isActive: true });
    }

    // Check each component has a result
    const componentsWithScores = [];
    for (const component of allComponents) {
      const latest = await Result.findOne({
        studentId,
        moduleId,
        componentId: component._id
      }).sort({ attemptNumber: -1 });

      if (!latest) {
        // Not all components have results yet
        return null;
      }

      componentsWithScores.push({
        componentId: component._id,
        componentType: module.deliveryModel === 'SYSTEM_BASED' ? 'SUBJECT' : 'ASSESSMENT_COMPONENT',
        name: component.name,
        score: latest.score,
        maxScore: latest.maxScore,
        weight: component.weight
      });
    }

    // Calculate
    const calculation = resultCalculationService.calculateModuleResult(componentsWithScores);

    // Get academic context for grading
    const student = await Student.findById(studentId);
    const period = await AcademicPeriod.findById(module.academicPeriodId);
    const level = await AcademicLevel.findById(period.academicLevelId);
    const department = await Department.findById(level.departmentId);

    // Grade
    const gradingModel = department?.gradingModel || 'GPA';
    const grading = gradingService.calculateGrade(calculation.percentage, gradingModel);

    // Upsert
    const moduleResult = await ModuleResult.findOneAndUpdate(
      {
        studentId,
        moduleId,
        attemptType: 'ORIGINAL',
        attemptNumber: 1
      },
      {
        studentId,
        studentIdentifier: student.studentId,
        moduleId,
        moduleName: module.name,
        academicLevelId: level._id,
        academicPeriodId: period._id,
        cohortId: student.currentCohortId,
        percentage: calculation.percentage,
        grade: grading.grade,
        gradePoint: grading.gradePoint,
        attemptType: 'ORIGINAL',
        attemptNumber: 1,
        componentSnapshot: calculation.componentSnapshot,
        calculatedBy: userId,
        calculatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    return moduleResult;
  } catch (error) {
    console.error('tryRecalculateModuleResult error:', error);
    return null;
  }
};

module.exports = {
  createResult,
  bulkCreateResults,
  getResults,
  getResult,
  getMyResults,
  getMyModuleResults,
  getModuleResults,
  getStudentResults,
  updateResult,
  deleteResult
};