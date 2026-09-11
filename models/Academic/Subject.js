const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: 0,
    max: 100
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
subjectSchema.index({ moduleId: 1, name: 1 }, { unique: true });
subjectSchema.index({ moduleId: 1, order: 1 }, { unique: true });

// Virtuals
subjectSchema.virtual('module', {
  ref: 'Module',
  localField: 'moduleId',
  foreignField: '_id',
  justOne: true
});

subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;