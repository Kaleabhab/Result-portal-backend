const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cohort name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Cohort code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: [true, 'Academic level ID is required']
  },
  admissionYear: {
    type: String,
    required: [true, 'Admission year is required'],
    trim: true
  },
  expectedGraduationYear: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    default: Date.now
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
cohortSchema.index({ academicLevelId: 1, admissionYear: 1 }, { unique: true });

// Virtuals
cohortSchema.virtual('academicLevel', {
  ref: 'AcademicLevel',
  localField: 'academicLevelId',
  foreignField: '_id',
  justOne: true
});

cohortSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'currentCohortId'
});

cohortSchema.set('toJSON', { virtuals: true });
cohortSchema.set('toObject', { virtuals: true });

const Cohort = mongoose.model('Cohort', cohortSchema);

module.exports = Cohort;