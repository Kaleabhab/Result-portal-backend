import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

  // ========== MODULE CATEGORY ==========
  category: {
    type: String,
    enum: ['MAJOR', 'MINOR'],
    default: 'MAJOR'
  },

  // ========== DELIVERY MODEL ==========
  // Determines how results are structured:
  // - SYSTEM_BASED: Module → Subject → Result
  // - ASSESSMENT_BASED: Module → AssessmentComponent → Result
  deliveryModel: {
    type: String,
    enum: ['SYSTEM_BASED', 'ASSESSMENT_BASED'],
    default: 'SYSTEM_BASED',
    required: true
  },

  // ========== NEW: PROGRESSION CHARACTERISTIC ==========
  // Determines how this specific module affects progression
  progressionCharacteristic: {
    type: String,
    enum: ['ONE_YEAR_LAG', 'ONE_SEMESTER_LAG', 'NO_LAG'],
    default: 'NO_LAG'
  },

  progressionRule: {
    type: String,
    enum: ['pass_all', 'pass_most', 'weighted_average', 'none'],
    default: 'pass_all'
  },

  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],


    order: {
      type: Number,
    min: 0,
    default: 0
    },

    // GPA system
    credit: {
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
  },

    // optional classification (useful later)
    type: {
      type: String,
      enum: ["core", "elective"],
      default: "core",
    },
  },
  { timestamps: true }
);

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

moduleSchema.virtual('assessmentComponents', {
  ref: 'AssessmentComponent',
  localField: '_id',
  foreignField: 'moduleId'
});

// Helper: Get components based on delivery model
moduleSchema.methods.getComponents = async function() {
  if (this.deliveryModel === 'SYSTEM_BASED') {
    return await mongoose.model('Subject').find({ moduleId: this._id, isActive: true });
  } else {
    return await mongoose.model('AssessmentComponent').find({ moduleId: this._id, isActive: true });
  }
};

moduleSchema.set('toJSON', { virtuals: true });
moduleSchema.set('toObject', { virtuals: true });

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;