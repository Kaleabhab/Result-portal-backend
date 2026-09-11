const Student = require('../models/Student');
const User = require('../models/User');
const AcademicLevel = require('../models/Academic/AcademicLevel');
const Class = require('../models/Academic/Class');
const Department = require('../models/Academic/Department');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper: Generate temporary password
const generateTemporaryPassword = (firstName, lastName, studentId) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}${studentId}`;
};

// @desc    Register a single student
// @route   POST /api/students/admin/register
// @access  Private (Admin only)
const registerStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentId,
      firstName,
      lastName,
      middleName,
      displayName,
      email,
      gender,
      dateOfBirth,
      phone,
      address,
      academicLevelId,
      classId,
      admissionYear
    } = req.body;

    // Validate required fields
    if (!studentId || !firstName || !lastName || !email || !academicLevelId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Validate academic level
    const academicLevel = await AcademicLevel.findById(academicLevelId);
    if (!academicLevel) {
      return res.status(400).json({
        success: false,
        message: 'Academic level not found'
      });
    }

    // Validate class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(400).json({
        success: false,
        message: 'Class not found'
      });
    }

    // IMPORTANT: Validate that class belongs to academic level
    if (classObj.academicLevelId.toString() !== academicLevelId) {
      return res.status(400).json({
        success: false,
        message: 'Class does not belong to the selected academic level'
      });
    }

    // Get department from academic structure
    const department = await Department.findById(academicLevel.departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found for this academic level'
      });
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword(firstName, lastName, studentId);

    // Create Student
    const student = await Student.create([{
      studentId,
      firstName,
      lastName,
      middleName: middleName || '',
      displayName: displayName || `${firstName} ${lastName}`,
      email,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      phone: phone || '',
      address: address || '',
      academicLevelId,
      classId,
      admissionYear,
      academicStatus: 'active'
    }], { session });

    // Create User account
    const user = await User.create([{
      email,
      password: tempPassword,
      role: 'student',
      studentId,
      displayName: displayName || `${firstName} ${lastName}`,
      isActive: true,
      mustChangePassword: true
    }], { session });

    // Link student to user
    student[0].userId = user[0]._id;
    await student[0].save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Return success with temporary password
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        student: {
          studentId: student[0].studentId,
          displayName: student[0].displayName,
          email: student[0].email,
          academicLevel: academicLevel.name,
          class: classObj.name,
          department: department.name
        },
        temporaryPassword: tempPassword,
        mustChangePassword: true
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Register student error:', error);
    res.status(500).json({
      success: false,
      message: 'Student registration failed',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Bulk register students from Excel
// @route   POST /api/students/admin/bulk-register
// @access  Private (Admin only)
const bulkRegisterStudents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of students'
      });
    }

    const results = {
      total: students.length,
      successful: 0,
      failed: 0,
      errors: [],
      students: []
    };

    // Validate each student
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      const rowNumber = i + 1;

      try {
        const {
          studentId,
          firstName,
          lastName,
          email,
          gender,
          dateOfBirth,
          academicLevelId,
          classId,
          admissionYear
        } = studentData;

        // Validate required fields
        if (!studentId || !firstName || !lastName || !email || !academicLevelId || !classId) {
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields'
          });
          results.failed++;
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
          results.errors.push({
            row: rowNumber,
            error: 'Student ID already exists'
          });
          results.failed++;
          continue;
        }

        // Check if email already exists
        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
          results.errors.push({
            row: rowNumber,
            error: 'Email already exists'
          });
          results.failed++;
          continue;
        }

        // Validate academic level
        const academicLevel = await AcademicLevel.findById(academicLevelId);
        if (!academicLevel) {
          results.errors.push({
            row: rowNumber,
            error: 'Academic level not found'
          });
          results.failed++;
          continue;
        }

        // Validate class
        const classObj = await Class.findById(classId);
        if (!classObj) {
          results.errors.push({
            row: rowNumber,
            error: 'Class not found'
          });
          results.failed++;
          continue;
        }

        // Validate class belongs to academic level
        if (classObj.academicLevelId.toString() !== academicLevelId) {
          results.errors.push({
            row: rowNumber,
            error: 'Class does not belong to selected academic level'
          });
          results.failed++;
          continue;
        }

        // Get department
        const department = await Department.findById(academicLevel.departmentId);
        if (!department) {
          results.errors.push({
            row: rowNumber,
            error: 'Department not found for this academic level'
          });
          results.failed++;
          continue;
        }

        // Generate temporary password
        const tempPassword = generateTemporaryPassword(firstName, lastName, studentId);

        // Create Student
        const student = await Student.create([{
          studentId,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`,
          email,
          gender: gender || 'male',
          dateOfBirth: new Date(dateOfBirth),
          academicLevelId,
          classId,
          admissionYear: admissionYear || new Date().getFullYear().toString(),
          academicStatus: 'active'
        }], { session });

        // Create User
        const user = await User.create([{
          email,
          password: tempPassword,
          role: 'student',
          studentId,
          displayName: `${firstName} ${lastName}`,
          isActive: true,
          mustChangePassword: true
        }], { session });

        // Link
        student[0].userId = user[0]._id;
        await student[0].save({ session });

        results.successful++;
        results.students.push({
          studentId,
          displayName: `${firstName} ${lastName}`,
          email,
          temporaryPassword: tempPassword,
          academicLevel: academicLevel.name,
          class: classObj.name,
          department: department.name
        });

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error.message
        });
        results.failed++;
      }
    }

    // Commit transaction if any students were created
    if (results.successful > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    res.status(200).json({
      success: true,
      message: 'Bulk registration completed',
      results
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk register error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk registration failed',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all students (admin)
// @route   GET /api/students/admin
// @access  Private (Admin only)
const adminGetStudents = async (req, res) => {
  try {
    const { search, classId, academicLevelId, status, page = 1, limit = 50 } = req.query;

    const query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (classId) {
      query.classId = classId;
    }

    if (academicLevelId) {
      query.academicLevelId = academicLevelId;
    }

    if (status) {
      query.academicStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate({
          path: 'academicLevelId',
          populate: {
            path: 'departmentId',
            populate: {
              path: 'collegeId'
            }
          }
        })
        .populate('classId')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Student.countDocuments(query)
    ]);

    // Get user status for each student
    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const user = await User.findOne({ studentId: student.studentId });
        return {
          ...student.toJSON(),
          accountStatus: user ? user.isActive : false,
          hasAccount: !!user
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithStatus.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: studentsWithStatus
    });

  } catch (error) {
    console.error('Admin get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students'
    });
  }
};

// @desc    Get single student (admin)
// @route   GET /api/students/admin/:studentId
// @access  Private (Admin only)
const adminGetStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId })
      .populate({
        path: 'academicLevelId',
        populate: {
          path: 'departmentId',
          populate: {
            path: 'collegeId'
          }
        }
      })
      .populate('classId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const user = await User.findOne({ studentId: student.studentId });

    res.status(200).json({
      success: true,
      data: {
        ...student.toJSON(),
        accountStatus: user ? user.isActive : false,
        hasAccount: !!user,
        userEmail: user ? user.email : null
      }
    });

  } catch (error) {
    console.error('Admin get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student'
    });
  }
};

// @desc    Get my profile (student)
// @route   GET /api/students/me
// @access  Private (Student only)
const getMyProfile = async (req, res) => {
  try {
    const { studentId } = req.user;

    const student = await Student.findOne({ studentId })
      .populate({
        path: 'academicLevelId',
        populate: {
          path: 'departmentId',
          populate: {
            path: 'collegeId'
          }
        }
      })
      .populate('classId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get user info
    const user = await User.findOne({ studentId });

    // Derive department from academic structure
    const department = student.academicLevelId?.departmentId;
    const college = department?.collegeId;

    res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        displayName: student.displayName,
        email: student.email,
        contactEmail: student.contactEmail,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        phone: student.phone,
        address: student.address,
        admissionYear: student.admissionYear,
        academicStatus: student.academicStatus,
        academicPlacement: {
          college: college ? {
            id: college._id,
            name: college.name,
            code: college.code
          } : null,
          department: department ? {
            id: department._id,
            name: department.name,
            code: department.code
          } : null,
          academicLevel: student.academicLevelId ? {
            id: student.academicLevelId._id,
            name: student.academicLevelId.name,
            code: student.academicLevelId.code,
            order: student.academicLevelId.order
          } : null,
          class: student.classId ? {
            id: student.classId._id,
            name: student.classId.name,
            code: student.classId.code
          } : null
        },
        account: {
          email: user ? user.email : null,
          isActive: user ? user.isActive : false,
          mustChangePassword: user ? user.mustChangePassword : false,
          lastLogin: user ? user.lastLogin : null
        }
      }
    });

  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};

// @desc    Update my profile (student)
// @route   PATCH /api/students/me
// @access  Private (Student only)
const updateMyProfile = async (req, res) => {
  try {
    const { studentId } = req.user;
    const allowedUpdates = ['email', 'contactEmail', 'phone', 'address'];
    const updates = {};

    // Only allow specific fields to be updated
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // If updating email, check uniqueness
    if (updates.email) {
      const existingStudent = await Student.findOne({
        email: updates.email,
        studentId: { $ne: studentId }
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const student = await Student.findOneAndUpdate(
      { studentId },
      updates,
      { new: true, runValidators: true }
    )
    .populate('academicLevelId')
    .populate('classId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // If email changed, update user email too
    if (updates.email) {
      await User.findOneAndUpdate(
        { studentId },
        { email: updates.email }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        studentId: student.studentId,
        displayName: student.displayName,
        email: student.email,
        contactEmail: student.contactEmail,
        phone: student.phone,
        address: student.address
      }
    });

  } catch (error) {
    console.error('Update my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Activate student account
// @route   PATCH /api/students/admin/:studentId/activate
// @access  Private (Admin only)
const activateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const user = await User.findOneAndUpdate(
      { studentId },
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account activated successfully',
      data: {
        studentId: student.studentId,
        displayName: student.displayName,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Activate student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate account'
    });
  }
};

// @desc    Deactivate student account
// @route   PATCH /api/students/admin/:studentId/deactivate
// @access  Private (Admin only)
const deactivateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const user = await User.findOneAndUpdate(
      { studentId },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
      data: {
        studentId: student.studentId,
        displayName: student.displayName,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Deactivate student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
};

module.exports = {
  registerStudent,
  bulkRegisterStudents,
  adminGetStudents,
  adminGetStudent,
  getMyProfile,
  updateMyProfile,
  activateStudent,
  deactivateStudent
};