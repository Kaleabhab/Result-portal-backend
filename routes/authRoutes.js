const express = require('express');
const router = express.Router();
const {
  login,
  firstLoginPasswordChange,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.patch('/first-login-password', protect, firstLoginPasswordChange);
router.patch('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;