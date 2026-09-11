const mongoose = require('mongoose');

const moduleResultSchema = new mongoose.Schema({
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

  // ========== MODULE REFERENCE ==========
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required'],
    index: true
  },
  moduleName: {
    type: String,
    required: true
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
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },

  // ========== CALCULATED RESULT ==========
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  gradePoint: {
    type: Number,
    default: 0
  },

  // ========== PROGRESSION ==========
  progressionStatus: {
    type: String,
    enum: ['PASS', 'RE_EXAM', 'LAG', 'PENDING'],
    default: 'PENDING'
  },
  progressionReason: {
    type: String,
    trim: true
  },

  // ========== ATTEMPT TRACKING ==========
  attemptType: {
    type: String,
    enum: ['ORIGINAL', 'RE_EXAM'],
    default: 'ORIGINAL'
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  },

  // ========== COMPONENT SNAPSHOT ==========
  // Preserves the components used in calculation
  componentSnapshot: [{
    componentId: mongoose.Schema.Types.ObjectId,
    componentType: String,
    componentName: String,
    score: Number,
    maxScore: Number,
    percentage: Number,
    weight: Number,
    contribution: Number
  }],

  // ========== RELEASE ==========
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

  // ========== CALCULATION METADATA ==========
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  calculationVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Compound unique index
moduleResultSchema.index(
  { studentId: 1, moduleId: 1, attemptType: 1, attemptNumber: 1 },
  { unique: true }
);

// Virtuals
moduleResultSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

moduleResultSchema.virtual('module', {
  ref: 'Module',
  localField: 'moduleId',
  foreignField: '_id',
  justOne: true
});

moduleResultSchema.set('toJSON', { virtuals: true });
moduleResultSchema.set('toObject', { virtuals: true });

const ModuleResult = mongoose.model('ModuleResult', moduleResultSchema);

module.exports = ModuleResult;