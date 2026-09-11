import express from 'express';
import {
  registerStudent,
  bulkRegisterStudents,
  adminGetStudents,
  adminGetStudent,
  resetPassword,
  activateStudent,
  deactivateStudent,
} from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';
import uploadExcel from '../middleware/upload.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Student Registration
router.post('/students', registerStudent);
router.post('/students/upload', uploadExcel, bulkRegisterStudents);

// Student Management (Read)
router.get('/students', adminGetStudents);
router.get('/students/:studentId', adminGetStudent);

// Account Management
router.post('/students/:studentId/reset-password', resetPassword);
router.patch('/students/:studentId/activate', activateStudent);
router.patch('/students/:studentId/deactivate', deactivateStudent);

export default router;