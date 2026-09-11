// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user is student
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student privileges required.'
    });
  }
};

// Allow admin or the specific student
const adminOrOwnStudent = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else if (req.user.role === 'student' && req.user.studentId) {
    // For operations where student is accessing their own data
    // This is a lightweight check - actual ownership validation happens in controller
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
};

module.exports = { adminOnly, studentOnly, adminOrOwnStudent };