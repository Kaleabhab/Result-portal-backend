/**
 * Assessment Component Controller
 */

const AssessmentComponent = require('../../models/Academic/AssessmentComponent');
const Module = require('../../models/Academic/Module');

// @desc    Create assessment component
// @route   POST /api/admin/academic/assessment-components
const createAssessmentComponent = async (req, res) => {
  try {
    const {
      name,
      code,
      moduleId,
      componentType,
      weight,
      maxScore,
      order,
      description
    } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(400).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (module.deliveryModel !== 'ASSESSMENT_BASED') {
      return res.status(400).json({
        success: false,
        message: 'Module is not ASSESSMENT_BASED'
      });
    }

    const component = await AssessmentComponent.create({
      name,
      code,
      moduleId,
      componentType,
      weight,
      maxScore,
      order,
      description
    });

    res.status(201).json({ success: true, data: component });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assessment component already exists'
      });
    }
    console.error('createAssessmentComponent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment component'
    });
  }
};

// @desc    Get all assessment components
// @route   GET /api/admin/academic/assessment-components
const getAssessmentComponents = async (req, res) => {
  try {
    const { moduleId } = req.query;
    const query = { isActive: true };
    if (moduleId) query.moduleId = moduleId;

    const components = await AssessmentComponent.find(query)
      .populate('module', 'name code')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('getAssessmentComponents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment components'
    });
  }
};

// @desc    Get single assessment component
// @route   GET /api/admin/academic/assessment-components/:id
const getAssessmentComponent = async (req, res) => {
  try {
    const component = await AssessmentComponent.findById(req.params.id)
      .populate('module');

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Assessment component not found'
      });
    }

    res.status(200).json({ success: true, data: component });
  } catch (error) {
    console.error('getAssessmentComponent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment component'
    });
  }
};

// @desc    Update assessment component
// @route   PATCH /api/admin/academic/assessment-components/:id
const updateAssessmentComponent = async (req, res) => {
  try {
    const component = await AssessmentComponent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Assessment component not found'
      });
    }

    res.status(200).json({ success: true, data: component });
  } catch (error) {
    console.error('updateAssessmentComponent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assessment component'
    });
  }
};

// @desc    Delete assessment component
// @route   DELETE /api/admin/academic/assessment-components/:id
const deleteAssessmentComponent = async (req, res) => {
  try {
    const Result = require('../../models/Result/Result');
    const results = await Result.find({ componentId: req.params.id });
    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${results.length} results exist`
      });
    }

    const component = await AssessmentComponent.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Assessment component not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment component deactivated',
      data: component
    });
  } catch (error) {
    console.error('deleteAssessmentComponent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment component'
    });
  }
};

module.exports = {
  createAssessmentComponent,
  getAssessmentComponents,
  getAssessmentComponent,
  updateAssessmentComponent,
  deleteAssessmentComponent
};