// This file will export all academic controllers
// We'll create separate controllers for each entity

const College = require('../models/Academic/College');
const Department = require('../models/Academic/Department');
const AcademicLevel = require('../models/Academic/AcademicLevel');
const AcademicPeriod = require('../models/Academic/AcademicPeriod');
const Class = require('../models/Academic/Class');
const Module = require('../models/Academic/Module');
const Subject = require('../models/Academic/Subject');
const mongoose = require('mongoose');

// ============ COLLEGE CONTROLLERS ============

// @desc    Create college
// @route   POST /api/admin/academic/colleges
// @access  Private (Admin only)
const createCollege = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const college = await College.create({
      name,
      code,
      description
    });

    res.status(201).json({
      success: true,
      data: college
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'College with this name or code already exists'
      });
    }
    console.error('Create college error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create college'
    });
  }
};

// @desc    Get all colleges
// @route   GET /api/admin/academic/colleges
// @access  Private (Admin only)
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true });
    res.status(200).json({
      success: true,
      count: colleges.length,
      data: colleges
    });
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve colleges'
    });
  }
};

// @desc    Get single college
// @route   GET /api/admin/academic/colleges/:id
// @access  Private (Admin only)
const getCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id)
      .populate('departments');

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      data: college
    });
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve college'
    });
  }
};

// @desc    Update college
// @route   PATCH /api/admin/academic/colleges/:id
// @access  Private (Admin only)
const updateCollege = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      data: college
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'College with this name or code already exists'
      });
    }
    console.error('Update college error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update college'
    });
  }
};

// @desc    Delete college
// @route   DELETE /api/admin/academic/colleges/:id
// @access  Private (Admin only)
const deleteCollege = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for dependencies
    const departments = await Department.find({ collegeId: req.params.id });
    if (departments.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete college with ${departments.length} associated departments. Archive or delete departments first.`
      });
    }

    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'College deactivated successfully',
      data: college
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete college error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete college'
    });
  } finally {
    session.endSession();
  }
};

// ============ DEPARTMENT CONTROLLERS ============

// @desc    Create department
// @route   POST /api/admin/academic/departments
// @access  Private (Admin only)
const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      collegeId,
      departmentType,
      entryPoint,
      academicModel,
      gradingModel,
      progressionPolicy,
      description
    } = req.body;

    // Validate college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(400).json({
        success: false,
        message: 'College not found'
      });
    }

    const department = await Department.create({
      name,
      code,
      collegeId,
      departmentType,
      entryPoint,
      academicModel,
      gradingModel,
      progressionPolicy,
      description
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
};

// @desc    Get all departments
// @route   GET /api/admin/academic/departments
// @access  Private (Admin only)
const getDepartments = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const query = { isActive: true };
    if (collegeId) query.collegeId = collegeId;

    const departments = await Department.find(query)
      .populate('college')
      .populate('academicLevels');

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments'
    });
  }
};

// @desc    Get single department
// @route   GET /api/admin/academic/departments/:id
// @access  Private (Admin only)
const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('college')
      .populate('academicLevels');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department'
    });
  }
};

// @desc    Update department
// @route   PATCH /api/admin/academic/departments/:id
// @access  Private (Admin only)
const updateDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      collegeId,
      departmentType,
      entryPoint,
      academicModel,
      gradingModel,
      progressionPolicy,
      description
    } = req.body;

    if (collegeId) {
      const college = await College.findById(collegeId);
      if (!college) {
        return res.status(400).json({
          success: false,
          message: 'College not found'
        });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        collegeId,
        departmentType,
        entryPoint,
        academicModel,
        gradingModel,
        progressionPolicy,
        description
      },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/admin/academic/departments/:id
// @access  Private (Admin only)
const deleteDepartment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check dependencies
    const academicLevels = await AcademicLevel.find({ departmentId: req.params.id });
    if (academicLevels.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${academicLevels.length} associated academic levels. Archive or delete them first.`
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully',
      data: department
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  } finally {
    session.endSession();
  }
};

// ============ ACADEMIC LEVEL CONTROLLERS ============

// @desc    Create academic level
// @route   POST /api/admin/academic/academic-levels
// @access  Private (Admin only)
const createAcademicLevel = async (req, res) => {
  try {
    const { name, code, departmentId, order, description } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    const academicLevel = await AcademicLevel.create({
      name,
      code,
      departmentId,
      order,
      description
    });

    res.status(201).json({
      success: true,
      data: academicLevel
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Academic level with this name or code already exists in this department'
      });
    }
    console.error('Create academic level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create academic level'
    });
  }
};

// @desc    Get all academic levels
// @route   GET /api/admin/academic/academic-levels
// @access  Private (Admin only)
const getAcademicLevels = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const query = { isActive: true };
    if (departmentId) query.departmentId = departmentId;

    const academicLevels = await AcademicLevel.find(query)
      .populate('department')
      .populate('classes')
      .populate('academicPeriods')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: academicLevels.length,
      data: academicLevels
    });
  } catch (error) {
    console.error('Get academic levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic levels'
    });
  }
};

// @desc    Get single academic level
// @route   GET /api/admin/academic/academic-levels/:id
// @access  Private (Admin only)
const getAcademicLevel = async (req, res) => {
  try {
    const academicLevel = await AcademicLevel.findById(req.params.id)
      .populate('department')
      .populate('classes')
      .populate('academicPeriods');

    if (!academicLevel) {
      return res.status(404).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    res.status(200).json({
      success: true,
      data: academicLevel
    });
  } catch (error) {
    console.error('Get academic level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic level'
    });
  }
};

// @desc    Update academic level
// @route   PATCH /api/admin/academic/academic-levels/:id
// @access  Private (Admin only)
const updateAcademicLevel = async (req, res) => {
  try {
    const { name, code, departmentId, order, description } = req.body;

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const academicLevel = await AcademicLevel.findByIdAndUpdate(
      req.params.id,
      { name, code, departmentId, order, description },
      { new: true, runValidators: true }
    );

    if (!academicLevel) {
      return res.status(404).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    res.status(200).json({
      success: true,
      data: academicLevel
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Academic level with this name or order already exists in this department'
      });
    }
    console.error('Update academic level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update academic level'
    });
  }
};

// @desc    Delete academic level
// @route   DELETE /api/admin/academic/academic-levels/:id
// @access  Private (Admin only)
const deleteAcademicLevel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check dependencies
    const classes = await Class.find({ academicLevelId: req.params.id });
    if (classes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete academic level with ${classes.length} associated classes. Archive or delete them first.`
      });
    }

    const academicPeriods = await AcademicPeriod.find({ academicLevelId: req.params.id });
    if (academicPeriods.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete academic level with ${academicPeriods.length} associated academic periods. Archive or delete them first.`
      });
    }

    const academicLevel = await AcademicLevel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!academicLevel) {
      return res.status(404).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Academic level deactivated successfully',
      data: academicLevel
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete academic level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete academic level'
    });
  } finally {
    session.endSession();
  }
};

// ============ ACADEMIC PERIOD CONTROLLERS ============

// @desc    Create academic period
// @route   POST /api/admin/academic/academic-periods
// @access  Private (Admin only)
const createAcademicPeriod = async (req, res) => {
  try {
    const {
      name,
      code,
      academicLevelId,
      order,
      duration,
      durationUnit,
      startDate,
      endDate,
      description
    } = req.body;

    const academicLevel = await AcademicLevel.findById(academicLevelId);
    if (!academicLevel) {
      return res.status(400).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    const academicPeriod = await AcademicPeriod.create({
      name,
      code,
      academicLevelId,
      order,
      duration,
      durationUnit,
      startDate,
      endDate,
      description
    });

    res.status(201).json({
      success: true,
      data: academicPeriod
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Academic period with this name or code already exists'
      });
    }
    console.error('Create academic period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create academic period'
    });
  }
};

// @desc    Get all academic periods
// @route   GET /api/admin/academic/academic-periods
// @access  Private (Admin only)
const getAcademicPeriods = async (req, res) => {
  try {
    const { academicLevelId } = req.query;
    const query = { isActive: true };
    if (academicLevelId) query.academicLevelId = academicLevelId;

    const academicPeriods = await AcademicPeriod.find(query)
      .populate('academicLevel')
      .populate('modules')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: academicPeriods.length,
      data: academicPeriods
    });
  } catch (error) {
    console.error('Get academic periods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic periods'
    });
  }
};

// @desc    Get single academic period
// @route   GET /api/admin/academic/academic-periods/:id
// @access  Private (Admin only)
const getAcademicPeriod = async (req, res) => {
  try {
    const academicPeriod = await AcademicPeriod.findById(req.params.id)
      .populate('academicLevel')
      .populate('modules');

    if (!academicPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Academic period not found'
      });
    }

    res.status(200).json({
      success: true,
      data: academicPeriod
    });
  } catch (error) {
    console.error('Get academic period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic period'
    });
  }
};

// @desc    Update academic period
// @route   PATCH /api/admin/academic/academic-periods/:id
// @access  Private (Admin only)
const updateAcademicPeriod = async (req, res) => {
  try {
    const {
      name,
      code,
      academicLevelId,
      order,
      duration,
      durationUnit,
      startDate,
      endDate,
      description
    } = req.body;

    if (academicLevelId) {
      const academicLevel = await AcademicLevel.findById(academicLevelId);
      if (!academicLevel) {
        return res.status(400).json({
          success: false,
          message: 'Academic level not found'
        });
      }
    }

    const academicPeriod = await AcademicPeriod.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        academicLevelId,
        order,
        duration,
        durationUnit,
        startDate,
        endDate,
        description
      },
      { new: true, runValidators: true }
    );

    if (!academicPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Academic period not found'
      });
    }

    res.status(200).json({
      success: true,
      data: academicPeriod
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Academic period with this name or code already exists'
      });
    }
    console.error('Update academic period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update academic period'
    });
  }
};

// @desc    Delete academic period
// @route   DELETE /api/admin/academic/academic-periods/:id
// @access  Private (Admin only)
const deleteAcademicPeriod = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check dependencies
    const modules = await Module.find({ academicPeriodId: req.params.id });
    if (modules.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete academic period with ${modules.length} associated modules. Archive or delete them first.`
      });
    }

    const academicPeriod = await AcademicPeriod.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!academicPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Academic period not found'
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Academic period deactivated successfully',
      data: academicPeriod
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Delete academic period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete academic period'
    });
  } finally {
    session.endSession();
  }
};

// ============ CLASS CONTROLLERS ============

// @desc    Create class
// @route   POST /api/admin/academic/classes
// @access  Private (Admin only)
const createClass = async (req, res) => {
  try {
    const {
      name,
      code,
      departmentId,
      academicLevelId,
      capacity,
      description
    } = req.body;

    // Validate academic level
    const academicLevel = await AcademicLevel.findById(academicLevelId);
    if (!academicLevel) {
      return res.status(400).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    // Validate department
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Validate that department matches academic level's department
    if (academicLevel.departmentId.toString() !== departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department does not match academic level\'s department'
      });
    }

    const classObj = await Class.create({
      name,
      code,
      departmentId,
      academicLevelId,
      capacity,
      description
    });

    res.status(201).json({
      success: true,
      data: classObj
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name or code already exists in this academic level'
      });
    }
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class'
    });
  }
};

// @desc    Get all classes
// @route   GET /api/admin/academic/classes
// @access  Private (Admin only)
const getClasses = async (req, res) => {
  try {
    const { academicLevelId, departmentId } = req.query;
    const query = { isActive: true };
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (departmentId) query.departmentId = departmentId;

    const classes = await Class.find(query)
      .populate('academicLevel')
      .populate('department')
      .populate('students');

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes'
    });
  }
};

// @desc    Get single class
// @route   GET /api/admin/academic/classes/:id
// @access  Private (Admin only)
const getClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('academicLevel')
      .populate('department')
      .populate('students');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classObj
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve class'
    });
  }
};

// @desc    Update class
// @route   PATCH /api/admin/academic/classes/:id
// @access  Private (Admin only)
const updateClass = async (req, res) => {
  try {
    const {
      name,
      code,
      departmentId,
      academicLevelId,
      capacity,
      description
    } = req.body;

    if (academicLevelId) {
      const academicLevel = await AcademicLevel.findById(academicLevelId);
      if (!academicLevel) {
        return res.status(400).json({
          success: false,
          message: 'Academic level not found'
        });
      }
    }

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const classObj = await Class.findByIdAndUpdate(
      req.params.id,
      { name, code, departmentId, academicLevelId, capacity, description },
      { new: true, runValidators: true }
    );

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classObj
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name or code already exists in this academic level'
      });
    }
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class'
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/admin/academic/classes/:id
// @access  Private (Admin only)
const deleteClass = async (req, res) => {
  try {
    // Check for students in class
    const students = await Student.find({ classId: req.params.id });
    if (students.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${students.length} enrolled students. Reassign or deactivate students first.`
      });
    }

    const classObj = await Class.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Class deactivated successfully',
      data: classObj
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class'
    });
  }
};

// ============ MODULE CONTROLLERS ============

// @desc    Create module
// @route   POST /api/admin/academic/modules
// @access  Private (Admin only)
const createModule = async (req, res) => {
  try {
    const {
      name,
      code,
      academicPeriodId,
      category,
      progressionRule,
      deliveryModel,
      prerequisites,
      credit,
      order,
      description
    } = req.body;

    const academicPeriod = await AcademicPeriod.findById(academicPeriodId);
    if (!academicPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Academic period not found'
      });
    }

    const module = await Module.create({
      name,
      code,
      academicPeriodId,
      category,
      progressionRule,
      deliveryModel,
      prerequisites: prerequisites || [],
      credit,
      order,
      description
    });

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Module with this name or code already exists'
      });
    }
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create module'
    });
  }
};

// @desc    Get all modules
// @route   GET /api/admin/academic/modules
// @access  Private (Admin only)
const getModules = async (req, res) => {
  try {
    const { academicPeriodId } = req.query;
    const query = { isActive: true };
    if (academicPeriodId) query.academicPeriodId = academicPeriodId;

    const modules = await Module.find(query)
      .populate('academicPeriod')
      .populate('subjects')
      .populate('prerequisites')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve modules'
    });
  }
};

// @desc    Get single module
// @route   GET /api/admin/academic/modules/:id
// @access  Private (Admin only)
const getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('academicPeriod')
      .populate('subjects')
      .populate('prerequisites');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve module'
    });
  }
};

// @desc    Update module
// @route   PATCH /api/admin/academic/modules/:id
// @access  Private (Admin only)
const updateModule = async (req, res) => {
  try {
    const {
      name,
      code,
      academicPeriodId,
      category,
      progressionRule,
      deliveryModel,
      prerequisites,
      credit,
      order,
      description
    } = req.body;

    if (academicPeriodId) {
      const academicPeriod = await AcademicPeriod.findById(academicPeriodId);
      if (!academicPeriod) {
        return res.status(400).json({
          success: false,
          message: 'Academic period not found'
        });
      }
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        academicPeriodId,
        category,
        progressionRule,
        deliveryModel,
        prerequisites,
        credit,
        order,
        description
      },
      { new: true, runValidators: true }
    );

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Module with this name or code already exists'
      });
    }
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module'
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/admin/academic/modules/:id
// @access  Private (Admin only)
const deleteModule = async (req, res) => {
  try {
    // Check for subjects
    const subjects = await Subject.find({ moduleId: req.params.id });
    if (subjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete module with ${subjects.length} associated subjects. Archive or delete them first.`
      });
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module deactivated successfully',
      data: module
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete module'
    });
  }
};

// ============ SUBJECT CONTROLLERS ============

// @desc    Create subject
// @route   POST /api/admin/academic/subjects
// @access  Private (Admin only)
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      moduleId,
      weight,
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

    const subject = await Subject.create({
      name,
      code,
      moduleId,
      weight,
      order,
      description
    });

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name or code already exists in this module'
      });
    }
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subject'
    });
  }
};

// @desc    Get all subjects
// @route   GET /api/admin/academic/subjects
// @access  Private (Admin only)
const getSubjects = async (req, res) => {
  try {
    const { moduleId } = req.query;
    const query = { isActive: true };
    if (moduleId) query.moduleId = moduleId;

    const subjects = await Subject.find(query)
      .populate('module')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subjects'
    });
  }
};

// @desc    Get single subject
// @route   GET /api/admin/academic/subjects/:id
// @access  Private (Admin only)
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('module');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subject'
    });
  }
};

// @desc    Update subject
// @route   PATCH /api/admin/academic/subjects/:id
// @access  Private (Admin only)
const updateSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      moduleId,
      weight,
      order,
      description
    } = req.body;

    if (moduleId) {
      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(400).json({
          success: false,
          message: 'Module not found'
        });
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code, moduleId, weight, order, description },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name or code already exists in this module'
      });
    }
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subject'
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/admin/academic/subjects/:id
// @access  Private (Admin only)
const deleteSubject = async (req, res) => {
  try {
    // Check if subject has results (for future implementation)
    // For now, just deactivate

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subject deactivated successfully',
      data: subject
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subject'
    });
  }
};

// ============ EXPORT ALL ============

module.exports = {
  // College
  createCollege,
  getColleges,
  getCollege,
  updateCollege,
  deleteCollege,

  // Department
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,

  // Academic Level
  createAcademicLevel,
  getAcademicLevels,
  getAcademicLevel,
  updateAcademicLevel,
  deleteAcademicLevel,

  // Academic Period
  createAcademicPeriod,
  getAcademicPeriods,
  getAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod,

  // Class
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,

  // Module
  createModule,
  getModules,
  getModule,
  updateModule,
  deleteModule,

  // Subject
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject
};