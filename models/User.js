const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: [
      'super_admin',
      'it_admin',
      'department_admin',
      'registration_admin',
      'class_admin',
      'student'
    ],
    
    required: true
  },

   // ========== SCOPE ==========
  // Which fields apply depends on the role
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  academicLevelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicLevel',
    default: null
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },

  // Student-specific

  studentId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,

  // ========== AUDIT FIELDS ==========
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// ========== INDEXES ==========
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ collegeId: 1 });
userSchema.index({ departmentId: 1 });
userSchema.index({ classId: 1 });
userSchema.index({ studentId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
// Check if this user is any type of admin
userSchema.methods.isAdmin = function() {
  return [
    'super_admin',
    'it_admin',
    'department_admin',
    'registration_admin',
    'class_admin'
  ].includes(this.role);
};

// Get the scope object for this user
userSchema.methods.getScope = function() {
  return {
    collegeId: this.collegeId,
    departmentId: this.departmentId,
    academicLevelId: this.academicLevelId,
    classId: this.classId
  };
};

// Create index for studentId for faster lookups
//userSchema.index({ studentId: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;