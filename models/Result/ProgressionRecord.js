const mongoose = require('mongoose');

const progressionRecordSchema = new mongoose.Schema({
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
  fromAcademicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: true
  },
  targetAcademicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel'
  },
  originalCohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },
  targetCohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },

  // ========== MODULE REFERENCE (if module-specific) ==========
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  moduleResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModuleResult'
  },

  // ========== OUTCOME ==========
  outcome: {
    type: String,
    enum: ['PASS', 'RE_EXAM', 'LAG', 'PROMOTED', 'REPEAT', 'GRADUATED'],
    required: [true, 'Outcome is required']
  },

  // ========== LAG SPECIFIC ==========
  lagType: {
    type: String,
    enum: ['ONE_YEAR_LAG', 'ONE_SEMESTER_LAG', 'NONE'],
    default: 'NONE'
  },
  lagDuration: {
    type: Number,
    min: 0
  },

  // ========== STATUS ==========
  status: {
    type: String,
    enum: ['PENDING', 'APPLIED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING',
    index: true
  },
  appliedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },

  // ========== REASON & METADATA ==========
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },

  // ========== AUDIT ==========
  determinedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  determinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
progressionRecordSchema.index({ studentId: 1, status: 1 });
progressionRecordSchema.index({ studentIdentifier: 1, createdAt: -1 });
progressionRecordSchema.index({ outcome: 1, status: 1 });

// Virtuals
progressionRecordSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

progressionRecordSchema.virtual('fromAcademicLevel', {
  ref: 'AcademicLevel',
  localField: 'fromAcademicLevelId',
  foreignField: '_id',
  justOne: true
});

progressionRecordSchema.virtual('targetAcademicLevel', {
  ref: 'AcademicLevel',
  localField: 'targetAcademicLevelId',
  foreignField: '_id',
  justOne: true
});

progressionRecordSchema.virtual('originalCohort', {
  ref: 'Cohort',
  localField: 'originalCohortId',
  foreignField: '_id',
  justOne: true
});

progressionRecordSchema.virtual('targetCohort', {
  ref: 'Cohort',
  localField: 'targetCohortId',
  foreignField: '_id',
  justOne: true
});

// Methods
progressionRecordSchema.methods.apply = async function(userId) {
  this.status = 'APPLIED';
  this.appliedAt = new Date();
  this.determinedBy = userId;
  return this.save();
};

progressionRecordSchema.methods.complete = function() {
  this.status = 'COMPLETED';
  this.completedAt = new Date();
  return this.save();
};

progressionRecordSchema.methods.cancel = function(reason) {
  this.status = 'CANCELLED';
  this.notes = reason;
  return this.save();
};

progressionRecordSchema.set('toJSON', { virtuals: true });
progressionRecordSchema.set('toObject', { virtuals: true });

const ProgressionRecord = mongoose.model('ProgressionRecord', progressionRecordSchema);

module.exports = ProgressionRecord;