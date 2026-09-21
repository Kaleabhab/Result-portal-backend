const ClassAdminApproval = require('../models/ClassAdminApproval');

const requireActiveApproval = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== 'class_admin') return next();

    const approval = await ClassAdminApproval.findOne({
      classAdminId: req.user._id,
      classId: req.user.classId,
      status: 'ACTIVE'
    });

    if (!approval) {
      return res.status(403).json({
        success: false,
        message: 'You are not approved to manage results for this academic cycle. Contact Department Admin.'
      });
    }

    req.classApproval = approval;
    next();
  } catch (error) {
    console.error('requireActiveApproval error:', error);
    res.status(500).json({ success: false, message: 'Approval validation failed' });
  }
};

module.exports = { requireActiveApproval };