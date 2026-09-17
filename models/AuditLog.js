const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // ========== ACTOR ==========
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Actor ID is required'],
    index: true
  },
  actorRole: {
    type: String,
    required: true,
    index: true
  },
  actorEmail: {
    type: String,
    trim: true
  },

  // ========== ACTION ==========
  action: {
    type: String,
    required: [true, 'Action is required'],
    index: true
    // Examples: LOGIN, LOGOUT, ADMIN_CREATED, ADMIN_DEACTIVATED,
    //           STUDENT_REGISTERED, RESULT_RELEASED, etc.
  },

  // ========== TARGET ==========
  targetType: {
    type: String,
    // Examples: User, Student, Result, Module, College, Department
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },

  // ========== RESULT ==========
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS',
    required: true
  },

  // ========== REQUEST METADATA ==========
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },

  // ========== ADDITIONAL INFO ==========
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// ========== INDEXES ==========
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

// ========== VIRTUALS ==========
auditLogSchema.virtual('actor', {
  ref: 'User',
  localField: 'actorId',
  foreignField: '_id',
  justOne: true
});

auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;