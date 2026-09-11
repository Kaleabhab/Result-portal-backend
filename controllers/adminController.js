import bcrypt from 'bcrypt';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { BCRYPT_ROUNDS, ROLES } from '../utils/constants.js';
import { generatePasswordFromNameAndId } from '../utils/generatePassword.js';
import { validateStudentData } from '../utils/validation.js';
import { parseStudentExcel } from '../services/excelService.js';

/**
 * Register a single student (admin only)
 * POST /api/admin/students
 */
export const registerStudent = async (req, res, next) => {
  try {
    const studentData = req.body;

    const validationError = validateStudentData(studentData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existingStudent = await Student.findOne({ studentId: studentData.studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student ID ${studentData.studentId} already exists`,
      });
    }

    const existingEmailStudent = await Student.findOne({ email: studentData.email.toLowerCase() });
    if (existingEmailStudent) {
      return res.status(400).json({
        success: false,
        message: `Email ${studentData.email} already registered as a student`,
      });
    }
    const existingEmailUser = await User.findOne({ email: studentData.email.toLowerCase() });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: `Email ${studentData.email} already has a user account`,
      });
    }

    const student = new Student({
      ...studentData,
      email: studentData.email.toLowerCase(),
    });
    await student.save();

    const tempPassword = generatePasswordFromNameAndId(
      studentData.fullName,
      studentData.studentId
    );
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const user = new User({
      email: studentData.email.toLowerCase(),
      password: hashedPassword,
      role: ROLES.STUDENT,
      studentId: studentData.studentId,
      isActive: true,
      mustChangePassword: true,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
        },
        temporaryPassword: tempPassword,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk registration via Excel upload
 * POST /api/admin/students/upload
 */
export const bulkRegisterStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const studentsData = parseStudentExcel(req.file.buffer);
    if (studentsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student data found in file',
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const data of studentsData) {
      try {
        const validationError = validateStudentData(data);
        if (validationError) {
          results.failed.push({ ...data, reason: validationError });
          continue;
        }

        const existingStudent = await Student.findOne({ studentId: data.studentId });
        if (existingStudent) {
          results.failed.push({ ...data, reason: `Student ID ${data.studentId} already exists` });
          continue;
        }
        const existingEmailStudent = await Student.findOne({ email: data.email.toLowerCase() });
        if (existingEmailStudent) {
          results.failed.push({ ...data, reason: `Email ${data.email} already registered as a student` });
          continue;
        }
        const existingEmailUser = await User.findOne({ email: data.email.toLowerCase() });
        if (existingEmailUser) {
          results.failed.push({ ...data, reason: `Email ${data.email} already has a user account` });
          continue;
        }

        const student = new Student({
          ...data,
          email: data.email.toLowerCase(),
        });
        await student.save();

        const tempPassword = generatePasswordFromNameAndId(data.fullName, data.studentId);
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const user = new User({
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: ROLES.STUDENT,
          studentId: data.studentId,
          isActive: true,
          mustChangePassword: true,
        });
        await user.save();

        results.success.push({
          studentId: data.studentId,
          email: data.email,
          temporaryPassword: tempPassword,
        });
      } catch (err) {
        results.failed.push({ ...data, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk registration completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin get all students (with optional filters)
 * GET /api/admin/students
 */
export const adminGetStudents = async (req, res, next) => {
  try {
    const { search, department, class: classFilter, academicYear, status, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      filter.department = department;
    }

    if (classFilter) {
      filter.class = classFilter;
    }

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // If status filter is provided, we need to join with User
    let students;
    let total;

    if (status) {
      // Find users with the given status
      const users = await User.find({ 
        role: ROLES.STUDENT,
        isActive: status === 'active' 
      }).select('studentId');
      
      const studentIds = users.map(u => u.studentId);
      filter.studentId = { $in: studentIds };
    }

    const skip = (page - 1) * limit;

    students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    total = await Student.countDocuments(filter);

    // Get account status for each student
    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const user = await User.findOne({ studentId: student.studentId }).select('isActive mustChangePassword lastLogin');
        return {
          ...student.toObject(),
          account: user || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin get single student
 * GET /api/admin/students/:studentId
 */
export const adminGetStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get the associated user account
    const user = await User.findOne({ studentId }).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      data: {
        student,
        account: user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin reset password (uses Name+ID rule)
 * POST /api/admin/students/:studentId/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found',
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    const tempPassword = generatePasswordFromNameAndId(student.fullName, student.studentId);
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user.password = hashedPassword;
    user.mustChangePassword = true;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        studentId: user.studentId,
        email: user.email,
        temporaryPassword: tempPassword,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin activate student account
 * PATCH /api/admin/students/:studentId/activate
 */
export const activateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found',
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is already active',
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account activated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deactivate student account
 * PATCH /api/admin/students/:studentId/deactivate
 */
export const deactivateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found',
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is already inactive',
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};