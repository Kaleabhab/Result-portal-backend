/**
 * Audit Log Controller — Super Admin only
 */

const AuditLog = require('../models/AuditLog');
const { AUDIT_ACTIONS, PAGINATION } = require('../config/adminConfig');

const getAuditLogs = async (req, res) => {
  try {
    const { actorId, actorRole, action, targetType, targetId, result, from, to,
            page = PAGINATION.defaultPage, limit = PAGINATION.defaultLimit } = req.query;

    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (actorRole) filter.actorRole = actorRole;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (result) filter.result = result;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const safeLimit = Math.min(Number(limit) || PAGINATION.defaultLimit, PAGINATION.maxLimit);
    const skip = (Number(page) - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'displayName email role')
        .sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      AuditLog.countDocuments(filter)
    ]);

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, actorEmail: req.user.email,
      action: AUDIT_ACTIONS.AUDIT_LOG_VIEWED, ipAddress: req.ip, userAgent: req.get?.('user-agent')
    });

    res.status(200).json({
      success: true, count: logs.length, total,
      page: Number(page), totalPages: Math.ceil(total / safeLimit),
      data: logs
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('actorId', 'displayName email role');
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    console.error('getAuditLog error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit log' });
  }
};

const filterAuditLogs = async (req, res) => {
  try {
    const { actorId, actorRole, action, targetType, targetId, result, from, to,
            page = PAGINATION.defaultPage, limit = PAGINATION.defaultLimit } = req.body || {};

    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (actorRole) filter.actorRole = actorRole;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (result) filter.result = result;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const safeLimit = Math.min(Number(limit) || PAGINATION.defaultLimit, PAGINATION.maxLimit);
    const skip = (Number(page) - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'displayName email role')
        .sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true, count: logs.length, total,
      page: Number(page), totalPages: Math.ceil(total / safeLimit),
      data: logs
    });
  } catch (error) {
    console.error('filterAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to filter audit logs' });
  }
};

const exportAuditLogs = async (req, res) => {
  try {
    const { from, to, actorId, action } = req.query;
    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'displayName email role')
      .sort({ createdAt: -1 }).limit(10000);

    await AuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, actorEmail: req.user.email,
      action: AUDIT_ACTIONS.AUDIT_LOG_EXPORTED,
      metadata: { count: logs.length },
      ipAddress: req.ip, userAgent: req.get?.('user-agent')
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
    res.status(200).send(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('exportAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
};

module.exports = { getAuditLogs, getAuditLog, filterAuditLogs, exportAuditLogs };