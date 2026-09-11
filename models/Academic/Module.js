const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Module code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  academicPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
    required: [true, 'Academic period ID is required']
  },
  category: {
    type: String,
    enum: ['core', 'elective', 'foundation', 'specialization'],
    default: 'core'
  },
  progressionRule: {
    type: String,
    enum: ['pass_all', 'pass_most', 'weighted_average', 'none'],
    default: 'pass_all'
  },
  deliveryModel: {
    type: String,
    enum: ['in_person', 'online', 'hybrid', 'blended'],
    default: 'in_person'
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  credit: {
    type: Number,
    min: 0,
    default: 0
  },
  order: {
    type: Number,
    min: 0,
    default: 0
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
moduleSchema.index({ academicPeriodId: 1, name: 1 }, { unique: true });

// Virtuals
moduleSchema.virtual('academicPeriod', {
  ref: 'AcademicPeriod',
  localField: 'academicPeriodId',
  foreignField: '_id',
  justOne: true
});

moduleSchema.virtual('subjects', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'moduleId'
});

moduleSchema.set('toJSON', { virtuals: true });
moduleSchema.set('toObject', { virtuals: true });

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;