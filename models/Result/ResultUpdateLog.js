const mongoose = require('mongoose');

const resultUpdateLogSchema = new mongoose.Schema({
  // ========== REFERENCES ==========
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result',
    required: [true, 'Result ID is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  componentType: {
    type: String,
    enum: ['SUBJECT', 'ASSESSMENT_COMPONENT'],
    required: true
  },

  // ========== CHANGE TRACKING ==========
  updateType: {
    type: String,
    enum: ['CORRECTION', 'SCORE_CHANGE', 'WEIGHT_CHANGE', 'OTHER'],
    default: 'CORRECTION',
    required: true
  },

  oldScore: {
    type: Number
  },
  newScore: {
    type: Number
  },
  oldMaxScore: {
    type: Number
  },
  newMaxScore: {
    type: Number
  },
  oldPercentage: {
    type: Number
  },
  newPercentage: {
    type: Number
  },
  oldContribution: {
    type: Number
  },
  newContribution: {
    type: Number
  },

  // ========== REASON ==========
  reason: {
    type: String,
    required: [true, 'Reason for update is required'],
    trim: true
  },

  // ========== AUDIT ==========
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // ========== RECALCULATION FLAGS ==========
  moduleResultRecalculated: {
    type: Boolean,
    default: false
  },
  progressionReevaluated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
resultUpdateLogSchema.index({ resultId: 1, createdAt: -1 });
resultUpdateLogSchema.index({ studentId: 1, moduleId: 1 });
resultUpdateLogSchema.index({ updatedBy: 1, createdAt: -1 });

// Virtuals
resultUpdateLogSchema.virtual('result', {
  ref: 'Result',
  localField: 'resultId',
  foreignField: '_id',
  justOne: true
});

resultUpdateLogSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true
});

resultUpdateLogSchema.set('toJSON', { virtuals: true });
resultUpdateLogSchema.set('toObject', { virtuals: true });

const ResultUpdateLog = mongoose.model('ResultUpdateLog', resultUpdateLogSchema);

module.exports = ResultUpdateLog;