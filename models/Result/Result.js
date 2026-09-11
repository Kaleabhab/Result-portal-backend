const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  // ========== STUDENT REFERENCE ==========
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  studentIdentifier: {
    type: String,
    required: true,
    index: true
  },

  // ========== ACADEMIC CONTEXT ==========
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: true
  },
  academicPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required'],
    index: true
  },
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },

  // ========== COMPONENT REFERENCE ==========
  // This can point to either Subject or AssessmentComponent
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Component ID is required'],
    index: true
  },
  componentType: {
    type: String,
    enum: ['SUBJECT', 'ASSESSMENT_COMPONENT'],
    required: [true, 'Component type is required']
  },
  componentName: {
    type: String,
    required: true
  },

  // ========== SCORES ==========
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: 1
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },

  // ========== WEIGHTING ==========
  componentWeight: {
    type: Number,
    required: [true, 'Component weight is required'],
    min: 0,
    max: 100
  },
  contributionToModule: {
    type: Number,
    min: 0,
    max: 100
  },

  // ========== ATTEMPT TRACKING ==========
  attemptType: {
    type: String,
    enum: ['ORIGINAL', 'RE_EXAM'],
    default: 'ORIGINAL',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  },

  // ========== RELEASE STATUS ==========
  released: {
    type: Boolean,
    default: false,
    index: true
  },
  releasedAt: {
    type: Date
  },
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ========== METADATA ==========
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// ========== INDEXES ==========
resultSchema.index({ studentId: 1, moduleId: 1, componentId: 1, attemptType: 1 });
resultSchema.index({ moduleId: 1, released: 1 });
resultSchema.index({ studentIdentifier: 1, moduleId: 1 });

// ========== VIRTUALS ==========
resultSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

resultSchema.virtual('module', {
  ref: 'Module',
  localField: 'moduleId',
  foreignField: '_id',
  justOne: true
});

// ========== PRE-SAVE: Calculate percentage & contribution ==========
resultSchema.pre('save', function(next) {
  // Calculate percentage
  if (this.score !== undefined && this.maxScore) {
    this.percentage = (this.score / this.maxScore) * 100;
  }

  // Calculate contribution to module
  if (this.percentage !== undefined && this.componentWeight !== undefined) {
    this.contributionToModule = (this.percentage * this.componentWeight) / 100;
  }

  next();
});

// ========== METHODS ==========
resultSchema.methods.release = function(userId) {
  this.released = true;
  this.releasedAt = new Date();
  this.releasedBy = userId;
  return this.save();
};

resultSchema.methods.unrelease = function() {
  this.released = false;
  this.releasedAt = undefined;
  this.releasedBy = undefined;
  return this.save();
};

resultSchema.set('toJSON', { virtuals: true });
resultSchema.set('toObject', { virtuals: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;