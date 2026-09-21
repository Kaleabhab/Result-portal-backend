const Student = require('../models/Student');
const User = require('../models/User');
const AcademicLevel = require('../models/Academic/AcademicLevel');
const Class = require('../models/Academic/Class');
const Department = require('../models/Academic/Department');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AuditLog = require('../models/AuditLog');

// ============================================================
// HELPERS
// ============================================================
const generateTemporaryPassword = (firstName, lastName, studentId) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}${studentId}`;
};

const audit = async (req, action, options = {}) => {
  try {
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action,
      targetType: options.targetType,
      targetId: options.targetId,
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
      metadata: options.metadata || {},
      description: options.description
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

const getLevelsInOwnDepartment = async (departmentId) => {
  return await AcademicLevel.find({ departmentId, isActive: true }).select('_id');
};

const ensureOwnDepartment = (req, res) => {
  if (!req.user.departmentId) {
    res.status(403).json({ success: false, message: 'No department assigned to your account' });
    return false;
  }
  return true;
};

// ============================================================
// REGISTRATION
// ============================================================
const registerStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentId, firstName, lastName, middleName, displayName, email,
      gender, dateOfBirth, phone, address, academicLevelId, classId, admissionYear
    } = req.body;

    if (!studentId || !firstName || !lastName || !email || !academicLevelId || !classId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const academicLevel = await AcademicLevel.findById(academicLevelId);
    if (!academicLevel) {
      return res.status(400).json({ success: false, message: 'Academic level not found' });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(400).json({ success: false, message: 'Class not found' });
    }

    if (classObj.academicLevelId.toString() !== academicLevelId) {
      return res.status(400).json({
        success: false,
        message: 'Class does not belong to the selected academic level'
      });
    }

    const department = await Department.findById(academicLevel.departmentId);
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }

    // SCOPE CHECK — registration admin must be in same college
    if (req.user.role === 'registration_admin') {
      if (!req.user.collegeId || department.collegeId.toString() !== req.user.collegeId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Student is outside your authorized college'
        });
      }
    }

    const tempPassword = generateTemporaryPassword(firstName, lastName, studentId);

    const student = await Student.create([{
      studentId, firstName, lastName,
      middleName: middleName || '',
      displayName: displayName || `${firstName} ${lastName}`,
      email, gender,
      dateOfBirth: new Date(dateOfBirth),
      phone: phone || '',
      address: address || '',
      academicLevelId, classId, admissionYear,
      academicStatus: 'active'
    }], { session });

    const user = await User.create([{
      email,
      password: tempPassword,
      role: 'student',
      studentId,
      displayName: displayName || `${firstName} ${lastName}`,
      isActive: true,
      mustChangePassword: true,
      createdBy: req.user._id
    }], { session });

    student[0].userId = user[0]._id;
    await student[0].save({ session });

    await session.commitTransaction();

    await audit(req, 'STUDENT_REGISTERED', {
      targetType: 'Student',
      targetId: student[0]._id,
      metadata: { studentId, email, academicLevel: academicLevel.name, class: classObj.name }
    });

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
    res.status(500).json({ success: false, message: 'Student registration failed', error: error.message });
  } finally {
    session.endSession();
  }
};

// ============================================================
// BULK REGISTRATION
// ============================================================
const bulkRegisterStudents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of students' });
    }

    const results = { total: students.length, successful: 0, failed: 0, errors: [], students: [] };

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const rowNumber = i + 1;

      try {
        const {
          studentId, firstName, lastName, email, gender, dateOfBirth,
          academicLevelId, classId, admissionYear
        } = row;

        if (!studentId || !firstName || !lastName || !email || !academicLevelId || !classId) {
          results.errors.push({ row: rowNumber, error: 'Missing required fields' });
          results.failed++;
          continue;
        }

        if (await Student.findOne({ studentId })) {
          results.errors.push({ row: rowNumber, error: 'Student ID already exists' });
          results.failed++;
          continue;
        }

        if (await Student.findOne({ email })) {
          results.errors.push({ row: rowNumber, error: 'Email already exists' });
          results.failed++;
          continue;
        }

        const academicLevel = await AcademicLevel.findById(academicLevelId);
        if (!academicLevel) {
          results.errors.push({ row: rowNumber, error: 'Academic level not found' });
          results.failed++;
          continue;
        }

        const classObj = await Class.findById(classId);
        if (!classObj) {
          results.errors.push({ row: rowNumber, error: 'Class not found' });
          results.failed++;
          continue;
        }

        if (classObj.academicLevelId.toString() !== academicLevelId) {
          results.errors.push({ row: rowNumber, error: 'Class does not belong to academic level' });
          results.failed++;
          continue;
        }

        const department = await Department.findById(academicLevel.departmentId);
        if (!department) {
          results.errors.push({ row: rowNumber, error: 'Department not found' });
          results.failed++;
          continue;
        }

        if (req.user.role === 'registration_admin') {
          if (!req.user.collegeId || department.collegeId.toString() !== req.user.collegeId.toString()) {
            results.errors.push({ row: rowNumber, error: 'Outside your authorized college' });
            results.failed++;
            continue;
          }
        }

        const tempPassword = generateTemporaryPassword(firstName, lastName, studentId);

        const student = await Student.create([{
          studentId, firstName, lastName,
          displayName: `${firstName} ${lastName}`,
          email,
          gender: gender || 'male',
          dateOfBirth: new Date(dateOfBirth),
          academicLevelId, classId,
          admissionYear: admissionYear || new Date().getFullYear().toString(),
          academicStatus: 'active'
        }], { session });

        const user = await User.create([{
          email, password: tempPassword,
          role: 'student', studentId,
          displayName: `${firstName} ${lastName}`,
          isActive: true, mustChangePassword: true,
          createdBy: req.user._id
        }], { session });

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
        results.errors.push({ row: rowNumber, error: error.message });
        results.failed++;
      }
    }

    if (results.successful > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    res.status(200).json({ success: true, message: 'Bulk registration completed', results });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk register error:', error);
    res.status(500).json({ success: false, message: 'Bulk registration failed', error: error.message });
  } finally {
    session.endSession();
  }
};

// ============================================================
// ADMIN GET ALL STUDENTS (registration admin)
// ============================================================
const adminGetStudents = async (req, res) => {
  try {
    const { search, classId, academicLevelId, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (req.user.role === 'registration_admin') {
      if (!req.user.collegeId) {
        return res.status(403).json({ success: false, message: 'No college assigned' });
      }
      const departments = await Department.find({ collegeId: req.user.collegeId }).select('_id');
      const deptIds = departments.map((d) => d._id);
      const levels = await AcademicLevel.find({ departmentId: { $in: deptIds } }).select('_id');
      query.academicLevelId = { $in: levels.map((l) => l._id) };
    }

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (classId) query.classId = classId;
    if (academicLevelId) query.academicLevelId = academicLevelId;
    if (status) query.academicStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate({
          path: 'academicLevelId',
          populate: { path: 'departmentId', populate: { path: 'collegeId' } }
        })
        .populate('classId')
        .populate('currentCohortId', 'name code admissionYear')
        .skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Student.countDocuments(query)
    ]);

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
    res.status(500).json({ success: false, message: 'Failed to retrieve students' });
  }
};

// ============================================================
// ADMIN GET SINGLE STUDENT
// ============================================================
const adminGetStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate({
        path: 'academicLevelId',
        populate: { path: 'departmentId', populate: { path: 'collegeId' } }
      })
      .populate('classId')
      .populate('currentCohortId', 'name code admissionYear')
      .populate('originalCohortId', 'name code admissionYear');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user.role === 'registration_admin') {
      const collegeId = student.academicLevelId?.departmentId?.collegeId?._id;
      if (!req.user.collegeId || !collegeId || collegeId.toString() !== req.user.collegeId.toString()) {
        return res.status(403).json({ success: false, message: 'Outside your college' });
      }
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
    res.status(500).json({ success: false, message: 'Failed to retrieve student' });
  }
};

// ============================================================
// STUDENT SELF-SERVICE
// ============================================================
const getMyProfile = async (req, res) => {
  try {
    const { studentId } = req.user;

    const student = await Student.findOne({ studentId })
      .populate({
        path: 'academicLevelId',
        populate: { path: 'departmentId', populate: { path: 'collegeId' } }
      })
      .populate('classId')
      .populate('currentCohortId', 'name code admissionYear')
      .populate('originalCohortId', 'name code admissionYear');

    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const user = await User.findOne({ studentId });
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
          college: college ? { id: college._id, name: college.name, code: college.code } : null,
          department: department ? { id: department._id, name: department.name, code: department.code } : null,
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
          } : null,
          originalCohort: student.originalCohortId || null,
          currentCohort: student.currentCohortId || null
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
    console.error('getMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { studentId } = req.user;
    const allowedUpdates = ['email', 'contactEmail', 'phone', 'address'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    if (updates.email) {
      const existing = await Student.findOne({ email: updates.email, studentId: { $ne: studentId } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const student = await Student.findOneAndUpdate({ studentId }, updates, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    if (updates.email) {
      await User.findOneAndUpdate({ studentId }, { email: updates.email });
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
    console.error('updateMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ============================================================
// ACTIVATE / DEACTIVATE
// ============================================================
const activateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate({ path: 'academicLevelId', populate: { path: 'departmentId' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.role === 'registration_admin') {
      const collegeId = student.academicLevelId?.departmentId?.collegeId;
      if (!req.user.collegeId || collegeId.toString() !== req.user.collegeId.toString()) {
        return res.status(403).json({ success: false, message: 'Outside your college' });
      }
    }

    const user = await User.findOneAndUpdate({ studentId: student.studentId }, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' });

    await audit(req, 'STUDENT_ACTIVATED', { targetType: 'User', targetId: user._id });

    res.status(200).json({
      success: true,
      message: 'Account activated',
      data: { studentId: student.studentId, displayName: student.displayName, isActive: user.isActive }
    });
  } catch (error) {
    console.error('activateStudent error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate account' });
  }
};

const deactivateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate({ path: 'academicLevelId', populate: { path: 'departmentId' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.role === 'registration_admin') {
      const collegeId = student.academicLevelId?.departmentId?.collegeId;
      if (!req.user.collegeId || collegeId.toString() !== req.user.collegeId.toString()) {
        return res.status(403).json({ success: false, message: 'Outside your college' });
      }
    }

    const user = await User.findOneAndUpdate({ studentId: student.studentId }, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' });

    await audit(req, 'STUDENT_DEACTIVATED', { targetType: 'User', targetId: user._id });

    res.status(200).json({
      success: true,
      message: 'Account deactivated',
      data: { studentId: student.studentId, displayName: student.displayName, isActive: user.isActive }
    });
  } catch (error) {
    console.error('deactivateStudent error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate account' });
  }
};

// ============================================================
// DEPARTMENT ADMIN — STUDENT VIEWS
// (merged from departmentAdmin/studentController.js)
// ============================================================

const getDepartmentStudents = async (req, res) => {
  try {
    if (!ensureOwnDepartment(req, res)) return;

    const levels = await getLevelsInOwnDepartment(req.user.departmentId);
    const levelIds = levels.map((l) => l._id);

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find({ academicLevelId: { $in: levelIds } })
        .populate('academicLevelId', 'name code order')
        .populate('classId', 'name code')
        .populate('currentCohortId', 'name code admissionYear')
        .skip(skip).limit(parseInt(limit))
        .sort({ 'academicLevelId.order': 1, displayName: 1 }),
      Student.countDocuments({ academicLevelId: { $in: levelIds } })
    ]);

    res.status(200).json({
      success: true, count: students.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: students
    });
  } catch (error) {
    console.error('getDepartmentStudents error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve department students' });
  }
};

const getStudentsByLevel = async (req, res) => {
  try {
    if (!ensureOwnDepartment(req, res)) return;

    const levels = await AcademicLevel.find({
      departmentId: req.user.departmentId,
      isActive: true
    }).sort({ order: 1 });

    const result = [];
    for (const level of levels) {
      const students = await Student.find({ academicLevelId: level._id })
        .populate('classId', 'name code')
        .sort({ displayName: 1 });

      result.push({
        academicLevel: { _id: level._id, name: level.name, code: level.code, order: level.order },
        studentCount: students.length,
        students: students.map((s) => ({
          studentId: s.studentId,
          displayName: s.displayName,
          class: s.classId ? { _id: s.classId._id, name: s.classId.name, code: s.classId.code } : null,
          academicStatus: s.academicStatus
        }))
      });
    }

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('getStudentsByLevel error:', error);
    res.status(500).json({ success: false, message: 'Failed to group students by level' });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    if (!ensureOwnDepartment(req, res)) return;

    const levels = await getLevelsInOwnDepartment(req.user.departmentId);
    const levelIds = levels.map((l) => l._id);

    const classes = await Class.find({
      academicLevelId: { $in: levelIds },
      isActive: true
    })
      .populate('academicLevelId', 'name code order')
      .sort({ 'academicLevelId.order': 1, name: 1 });

    const result = [];
    for (const cls of classes) {
      const students = await Student.find({ classId: cls._id }).sort({ displayName: 1 });

      result.push({
        class: {
          _id: cls._id, name: cls.name, code: cls.code,
          academicLevel: cls.academicLevelId ? {
            _id: cls.academicLevelId._id,
            name: cls.academicLevelId.name,
            code: cls.academicLevelId.code,
            order: cls.academicLevelId.order
          } : null
        },
        studentCount: students.length,
        students: students.map((s) => ({
          studentId: s.studentId,
          displayName: s.displayName,
          academicStatus: s.academicStatus
        }))
      });
    }

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('getStudentsByClass error:', error);
    res.status(500).json({ success: false, message: 'Failed to group students by class' });
  }
};

const filterStudents = async (req, res) => {
  try {
    if (!ensureOwnDepartment(req, res)) return;

    const levels = await getLevelsInOwnDepartment(req.user.departmentId);
    const levelIds = levels.map((l) => l._id);

    const { academicLevelId, classId, search, status } = req.query;
    const query = { academicLevelId: { $in: levelIds } };

    if (academicLevelId) {
      if (!levelIds.some((id) => id.toString() === academicLevelId)) {
        return res.status(403).json({ success: false, message: 'Academic level not in your department' });
      }
      query.academicLevelId = academicLevelId;
    }

    if (classId) query.classId = classId;
    if (status) query.academicStatus = status;

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('academicLevelId', 'name code order')
      .populate('classId', 'name code')
      .sort({ 'academicLevelId.order': 1, displayName: 1 });

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('filterStudents error:', error);
    res.status(500).json({ success: false, message: 'Failed to filter students' });
  }
};

const getDepartmentStudent = async (req, res) => {
  try {
    if (!ensureOwnDepartment(req, res)) return;

    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate({
        path: 'academicLevelId',
        populate: { path: 'departmentId', populate: { path: 'collegeId' } }
      })
      .populate('classId')
      .populate('currentCohortId', 'name code admissionYear');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const studentDept = student.academicLevelId?.departmentId?._id;
    if (!studentDept || studentDept.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ success: false, message: 'Student is outside your department' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('getDepartmentStudent error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student' });
  }
};

// ============================================================
// CLASS ADMIN — STUDENT VIEWS
// (merged from classAdmin/studentController.js)
// ============================================================

const getClassStudents = async (req, res) => {
  try {
    if (!req.user.classId) {
      return res.status(403).json({ success: false, message: 'No class assigned to your account' });
    }

    const { search, status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { classId: req.user.classId };
    if (status) query.academicStatus = status;

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('academicLevelId', 'name code order')
        .populate('classId', 'name code')
        .skip(skip).limit(parseInt(limit)).sort({ displayName: 1 }),
      Student.countDocuments(query)
    ]);

    res.status(200).json({
      success: true, count: students.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: students
    });
  } catch (error) {
    console.error('getClassStudents error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve class students' });
  }
};

const getClassStudent = async (req, res) => {
  try {
    if (!req.user.classId) {
      return res.status(403).json({ success: false, message: 'No class assigned' });
    }

    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate('academicLevelId', 'name code order')
      .populate('classId', 'name code')
      .populate('currentCohortId', 'name code admissionYear');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (!student.classId || student.classId._id.toString() !== req.user.classId.toString()) {
      return res.status(403).json({ success: false, message: 'Student is outside your class' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('getClassStudent error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student' });
  }
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  // Registration admin
  registerStudent,
  bulkRegisterStudents,
  adminGetStudents,
  adminGetStudent,
  activateStudent,
  deactivateStudent,

  // Student self-service
  getMyProfile,
  updateMyProfile,

  // Department admin — student views
  getDepartmentStudents,
  getStudentsByLevel,
  getStudentsByClass,
  filterStudents,
  getDepartmentStudent,

  // Class admin — student views
  getClassStudents,
  getClassStudent
};