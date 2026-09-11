const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  // Academic placement - references to Academic Structure
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    required: [true, 'Academic level ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  // ========== NEW: COHORT TRACKING ==========
  originalCohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    default: null
  },
  currentCohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    default: null
  },
  admissionYear: {
    type: String,
    required: [true, 'Admission year is required'],
    trim: true
  },

  // ========== PLACEMENT HISTORY ==========
  placementHistory: [{
    academicLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicLevel'
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cohort'
    },
    reason: {
      type: String,
      enum: ['INITIAL', 'PROGRESSION', 'LAG', 'PROMOTION', 'TRANSFER', 'OTHER'],
      default: 'INITIAL'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Reference back to User account
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Academic status
  academicStatus: {
    type: String,
    enum: ['active', 'graduated', 'suspended', 'withdrawn'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index for academic level and class validation
studentSchema.index({ academicLevelId: 1, classId: 1 });
studentSchema.index({ currentCohortId: 1 });
studentSchema.index({ originalCohortId: 1 });

// Virtual for full academic placement
studentSchema.virtual('academicPlacement').get(function() {
  return {
    academicLevelId: this.academicLevelId,
    classId: this.classId,
    originalCohortId: this.originalCohortId,
    currentCohortId: this.currentCohortId
  };
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;