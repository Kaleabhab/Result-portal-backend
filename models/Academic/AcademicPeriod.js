const mongoose = require('mongoose');

const academicPeriodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Academic period name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Academic period code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: [true, 'Academic level ID is required']
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0
  },
  duration: {
    type: Number,
    min: 1,
    default: 1
  },
  durationUnit: {
    type: String,
    enum: ['weeks', 'months', 'semester', 'trimester', 'quarter'],
    default: 'semester'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
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
academicPeriodSchema.index({ academicLevelId: 1, name: 1 }, { unique: true });
academicPeriodSchema.index({ academicLevelId: 1, order: 1 }, { unique: true });

// Virtuals
academicPeriodSchema.virtual('academicLevel', {
  ref: 'AcademicLevel',
  localField: 'academicLevelId',
  foreignField: '_id',
  justOne: true
});

academicPeriodSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'academicPeriodId'
});

academicPeriodSchema.set('toJSON', { virtuals: true });
academicPeriodSchema.set('toObject', { virtuals: true });

const AcademicPeriod = mongoose.model('AcademicPeriod', academicPeriodSchema);

module.exports = AcademicPeriod;