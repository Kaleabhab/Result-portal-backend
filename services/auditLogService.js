/**
 * Audit Log Service
 * Records administrative actions for accountability
 */

const AuditLog = require('../models/AuditLog');

// ============================================================
// Core logging function
// ============================================================
const log = async ({
  actorId,
  actorRole,
  actorEmail,
  action,
  targetType,
  targetId,
  result = 'SUCCESS',
  ipAddress,
  userAgent,
  metadata = {},
  description
}) => {
  try {
    const entry = await AuditLog.create({
      actorId,
      actorRole,
      actorEmail,
      action,
      targetType,
      targetId,
      result,
      ipAddress,
      userAgent,
      metadata,
      description
    });
    return entry;
  } catch (error) {
    // Never fail the main operation because of audit logging
    console.error('AuditLog error:', error);
    return null;
  }
};

// ============================================================
// Convenience logger — extracts actor from req
// ============================================================
const logFromRequest = async (req, action, options = {}) => {
  const actor = req.user;
  if (!actor) return null;

  return log({
    actorId: actor._id,
    actorRole: actor.role,
    actorEmail: actor.email,
    action,
    targetType: options.targetType,
    targetId: options.targetId,
    result: options.result || 'SUCCESS',
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    metadata: options.metadata || {},
    description: options.description
  });
};

// ============================================================
// Query helpers
// ============================================================
const getLogs = async (filter = {}, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorId', 'displayName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter)
  ]);

  return {
    logs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

const getLogsForActor = async (actorId, options = {}) => {
  return getLogs({ actorId }, options);
};

const getLogsForTarget = async (targetType, targetId, options = {}) => {
  return getLogs({ targetType, targetId }, options);
};

module.exports = {
  log,
  logFromRequest,
  getLogs,
  getLogsForActor,
  getLogsForTarget
};