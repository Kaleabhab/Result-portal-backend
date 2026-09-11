import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

export const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  sendJSON(res, statusCode, {
    success: true,
    message,
    ...(data && { data }),
  });
};

export const sendError = (res, statusCode = 400, message = 'Error') => {
  sendJSON(res, statusCode, {
    success: false,
    message,
  });
};

export const generatePasswordFromNameAndId = (fullName, studentId) => {
  if (!fullName || !studentId) {
    throw new Error('Full name and student ID are required');
  }

  const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);

  if (nameParts.length === 0) {
    throw new Error('Invalid full name');
  }

  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts.length > 1
    ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    : firstInitial;

  return `${firstInitial}${lastInitial}${studentId}`;
};

export const validateStudentData = (data) => {
  const requiredFields = [
    'studentId',
    'fullName',
    'email',
    'gender',
    'dateOfBirth',
    'department',
    'class',
    'admissionYear',
    'academicYear',
  ];

  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return `${field} is required`;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Invalid email format';
  }

  if (!['Male', 'Female', 'Other'].includes(data.gender)) {
    return 'Gender must be Male, Female, or Other';
  }

  if (isNaN(Date.parse(data.dateOfBirth))) {
    return 'Invalid date of birth';
  }

  const year = Number(data.admissionYear);
  if (isNaN(year) || year < 1900 || year > 2100) {
    return 'Invalid admission year';
  }

  return null;
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};