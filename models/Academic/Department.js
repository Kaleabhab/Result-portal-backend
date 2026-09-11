const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College ID is required']
  },
  departmentType: {
    type: String,
    enum: ['academic', 'administrative', 'research'],
    default: 'academic'
  },
  entryPoint: {
    type: String,
    trim: true
  },
  academicModel: {
    type: String,
    enum: ['semester', 'trimester', 'quarter', 'year'],
    default: 'semester'
  },
  gradingModel: {
    type: String,
    enum: ['GPA', 'percentage', 'letter', 'pass_fail'],
    default: 'GPA'
  },
  progressionPolicy: {
    type: String,
    enum: ['strict', 'moderate', 'flexible'],
    default: 'moderate'
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

// Compound unique index for name within college
departmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });

// Virtuals
departmentSchema.virtual('academicLevels', {
  ref: 'AcademicLevel',
  localField: '_id',
  foreignField: 'departmentId'
});

departmentSchema.virtual('college', {
  ref: 'College',
  localField: 'collegeId',
  foreignField: '_id',
  justOne: true
});

departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;