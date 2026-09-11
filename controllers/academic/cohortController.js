/**
 * Cohort Controller
 */

const Cohort = require('../../models/Academic/Cohort');
const AcademicLevel = require('../../models/Academic/AcademicLevel');

// @desc    Create cohort
// @route   POST /api/admin/academic/cohorts
const createCohort = async (req, res) => {
  try {
    const {
      name,
      code,
      academicLevelId,
      admissionYear,
      expectedGraduationYear,
      startDate,
      endDate,
      description
    } = req.body;

    const level = await AcademicLevel.findById(academicLevelId);
    if (!level) {
      return res.status(400).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    const cohort = await Cohort.create({
      name,
      code,
      academicLevelId,
      admissionYear,
      expectedGraduationYear,
      startDate,
      endDate,
      description
    });

    res.status(201).json({ success: true, data: cohort });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cohort already exists for this level and year'
      });
    }
    console.error('createCohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cohort'
    });
  }
};

// @desc    Get all cohorts
// @route   GET /api/admin/academic/cohorts
const getCohorts = async (req, res) => {
  try {
    const { academicLevelId, admissionYear } = req.query;
    const query = { isActive: true };
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (admissionYear) query.admissionYear = admissionYear;

    const cohorts = await Cohort.find(query)
      .populate('academicLevel', 'name code')
      .sort({ admissionYear: -1 });

    res.status(200).json({
      success: true,
      count: cohorts.length,
      data: cohorts
    });
  } catch (error) {
    console.error('getCohorts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cohorts'
    });
  }
};

// @desc    Get single cohort
// @route   GET /api/admin/academic/cohorts/:id
const getCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate('academicLevel')
      .populate('students');

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    res.status(200).json({ success: true, data: cohort });
  } catch (error) {
    console.error('getCohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cohort'
    });
  }
};

// @desc    Update cohort
// @route   PATCH /api/admin/academic/cohorts/:id
const updateCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    res.status(200).json({ success: true, data: cohort });
  } catch (error) {
    console.error('updateCohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cohort'
    });
  }
};

// @desc    Delete cohort (soft)
// @route   DELETE /api/admin/academic/cohorts/:id
const deleteCohort = async (req, res) => {
  try {
    const Student = require('../../models/Student');
    const students = await Student.find({ currentCohortId: req.params.id });
    if (students.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete cohort with ${students.length} students`
      });
    }

    const cohort = await Cohort.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cohort deactivated',
      data: cohort
    });
  } catch (error) {
    console.error('deleteCohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cohort'
    });
  }
};

module.exports = {
  createCohort,
  getCohorts,
  getCohort,
  updateCohort,
  deleteCohort
};