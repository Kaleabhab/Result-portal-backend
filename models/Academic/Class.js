const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: [true, 'Academic level ID is required']
  },
  capacity: {
    type: Number,
    min: 0
  },
  currentEnrollment: {
    type: Number,
    default: 0,
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

// Compound unique index - class name must be unique within academic level
classSchema.index({ academicLevelId: 1, name: 1 }, { unique: true });

// Virtuals
classSchema.virtual('academicLevel', {
  ref: 'AcademicLevel',
  localField: 'academicLevelId',
  foreignField: '_id',
  justOne: true
});

classSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

classSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'classId'
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;