const mongoose = require('mongoose');

const academicLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Academic level name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Academic level code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index
academicLevelSchema.index({ departmentId: 1, name: 1 }, { unique: true });
academicLevelSchema.index({ departmentId: 1, order: 1 }, { unique: true });

// Virtuals
academicLevelSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

academicLevelSchema.virtual('classes', {
  ref: 'Class',
  localField: '_id',
  foreignField: 'academicLevelId'
});

academicLevelSchema.virtual('academicPeriods', {
  ref: 'AcademicPeriod',
  localField: '_id',
  foreignField: 'academicLevelId'
});

academicLevelSchema.set('toJSON', { virtuals: true });
academicLevelSchema.set('toObject', { virtuals: true });

const AcademicLevel = mongoose.model('AcademicLevel', academicLevelSchema);

module.exports = AcademicLevel;