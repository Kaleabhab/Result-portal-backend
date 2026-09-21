const mongoose = require('mongoose');

const classAdminApprovalSchema = new mongoose.Schema({
  classAdminId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',           required: true, index: true },
  classId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Class',          required: true, index: true },
  academicLevelId:  { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicLevel',  required: true },
  academicPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicPeriod', required: true },
  cohortId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort' },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',           required: true },
  approvedAt:       { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
    default: 'ACTIVE',
    index: true
  },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revokedAt: Date,
  notes: String
}, { timestamps: true });

classAdminApprovalSchema.index(
  { classAdminId: 1, classId: 1, academicPeriodId: 1 },
  { unique: true }
);

module.exports = mongoose.model('ClassAdminApproval', classAdminApprovalSchema);