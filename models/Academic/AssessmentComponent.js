const mongoose = require('mongoose');

const assessmentComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assessment component name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Assessment component code is required'],
    uppercase: true,
    trim: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  // Type of assessment
  componentType: {
    type: String,
    enum: ['MIDTERM', 'ASSIGNMENT', 'QUIZ', 'FINAL_EXAM', 'PROJECT', 'PRACTICAL', 'PRESENTATION', 'OTHER'],
    default: 'OTHER'
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: 0,
    max: 100
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: 1,
    default: 100
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
assessmentComponentSchema.index({ moduleId: 1, name: 1 }, { unique: true });
assessmentComponentSchema.index({ moduleId: 1, code: 1 }, { unique: true });

// Virtuals
assessmentComponentSchema.virtual('module', {
  ref: 'Module',
  localField: 'moduleId',
  foreignField: '_id',
  justOne: true
});

assessmentComponentSchema.set('toJSON', { virtuals: true });
assessmentComponentSchema.set('toObject', { virtuals: true });

const AssessmentComponent = mongoose.model('AssessmentComponent', assessmentComponentSchema);

module.exports = AssessmentComponent;