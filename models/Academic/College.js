const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'College code is required'],
    unique: true,
    uppercase: true,
    trim: true
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

// Virtual for departments
collegeSchema.virtual('departments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'collegeId'
});

collegeSchema.set('toJSON', { virtuals: true });
collegeSchema.set('toObject', { virtuals: true });

const College = mongoose.model('College', collegeSchema);

module.exports = College;