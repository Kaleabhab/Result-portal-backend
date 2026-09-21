const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const auditLogController = require('../controllers/auditLogController');

const { protect } = require('../middleware/authMiddleware');
const { superAdminOnly, itAdminOnly, departmentAdminOnly } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { enforceDepartmentScope } = require('../middleware/scopeMiddleware');

router.use(protect);

// SUPER ADMIN → IT ADMINS
router.post('/it-admins', superAdminOnly, requirePermission('manage_it_admin'), adminController.createITAdmin);
router.get('/it-admins', superAdminOnly, adminController.getITAdmins);
router.get('/it-admins/:id', superAdminOnly, adminController.getITAdmin);
router.patch('/it-admins/:id', superAdminOnly, adminController.updateITAdmin);
router.patch('/it-admins/:id/activate', superAdminOnly, adminController.activateITAdmin);
router.patch('/it-admins/:id/deactivate', superAdminOnly, adminController.deactivateITAdmin);
router.patch('/it-admins/:id/reset-password', superAdminOnly, adminController.resetITAdminPassword);

// IT ADMIN → DEPARTMENT ADMINS
router.post('/department-admins', itAdminOnly, requirePermission('manage_department_admin'), adminController.createDepartmentAdmin);
router.get('/department-admins', itAdminOnly, adminController.getDepartmentAdmins);
router.get('/department-admins/:id', itAdminOnly, adminController.getDepartmentAdmin);
router.patch('/department-admins/:id', itAdminOnly, adminController.updateDepartmentAdmin);
router.patch('/department-admins/:id/activate', itAdminOnly, adminController.activateDepartmentAdmin);
router.patch('/department-admins/:id/deactivate', itAdminOnly, adminController.deactivateDepartmentAdmin);
router.patch('/department-admins/:id/reset-password', itAdminOnly, adminController.resetDepartmentAdminPassword);

// IT ADMIN → REGISTRATION ADMINS
router.post('/registration-admins', itAdminOnly, requirePermission('manage_registration_admin'), adminController.createRegistrationAdmin);
router.get('/registration-admins', itAdminOnly, adminController.getRegistrationAdmins);
router.get('/registration-admins/:id', itAdminOnly, adminController.getRegistrationAdmin);
router.patch('/registration-admins/:id', itAdminOnly, adminController.updateRegistrationAdmin);
router.patch('/registration-admins/:id/activate', itAdminOnly, adminController.activateRegistrationAdmin);
router.patch('/registration-admins/:id/deactivate', itAdminOnly, adminController.deactivateRegistrationAdmin);
router.patch('/registration-admins/:id/reset-password', itAdminOnly, adminController.resetRegistrationAdminPassword);

// DEPARTMENT ADMIN → CLASS ADMINS
router.post('/class-admins', departmentAdminOnly, requirePermission('manage_class_admin'), adminController.createClassAdmin);
router.get('/class-admins', departmentAdminOnly, adminController.getClassAdmins);
router.get('/class-admins/:id', departmentAdminOnly, adminController.getClassAdmin);
router.patch('/class-admins/:id', departmentAdminOnly, adminController.updateClassAdmin);
router.patch('/class-admins/:id/activate', departmentAdminOnly, adminController.activateClassAdmin);
router.patch('/class-admins/:id/deactivate', departmentAdminOnly, adminController.deactivateClassAdmin);
router.patch('/class-admins/:id/reset-password', departmentAdminOnly, adminController.resetClassAdminPassword);

// ============================================================
// CLASS ADMIN APPROVALS (Department Admin)
// ============================================================
router.get('/class-approvals', departmentAdminOnly, requirePermission('approve_class_admin'), adminController.listApprovals);
router.post('/class-approvals', departmentAdminOnly, requirePermission('approve_class_admin'), enforceDepartmentScope, adminController.createApproval);
router.patch('/class-approvals/:id/revoke', departmentAdminOnly, requirePermission('approve_class_admin'), adminController.revokeApproval);
router.get('/class-approvals/:id', departmentAdminOnly, requirePermission('approve_class_admin'), adminController.getApproval);

// ADMIN ACCOUNT / ACCESS
router.get('/accounts/:id', superAdminOnly, adminController.getAdminAccount);
router.patch('/accounts/:id/permissions', superAdminOnly, requirePermission('manage_admin_permissions'), adminController.updateAdminPermissions);
router.patch('/accounts/:id/scope', superAdminOnly, requirePermission('manage_admin_scope'), adminController.updateAdminScope);

// IT SYSTEM
router.post('/system/configuration', itAdminOnly, adminController.systemConfiguration);
router.post('/system/server-configuration', itAdminOnly, adminController.serverApplicationConfiguration);
router.post('/system/database-maintenance', itAdminOnly, adminController.databaseMaintenance);
router.post('/system/authentication-infrastructure', itAdminOnly, adminController.authenticationInfrastructure);
router.post('/system/security-configuration', itAdminOnly, adminController.securityConfiguration);
router.post('/system/backup-recovery', itAdminOnly, adminController.backupRecovery);
router.post('/system/technical-monitoring', itAdminOnly, adminController.technicalMonitoring);
router.post('/system/health', itAdminOnly, adminController.systemHealth);
router.post('/system/integration-configuration', itAdminOnly, adminController.integrationConfiguration);
router.post('/system/email-configuration', itAdminOnly, adminController.emailSystemConfiguration);
router.post('/system/technical-access-configuration', itAdminOnly, adminController.technicalAccessConfiguration);

// AUDIT LOGS
router.get('/audit-logs', superAdminOnly, requirePermission('manage_audit_logs'), auditLogController.getAuditLogs);
router.post('/audit-logs/filter', superAdminOnly, requirePermission('manage_audit_logs'), auditLogController.filterAuditLogs);
router.get('/audit-logs/export', superAdminOnly, requirePermission('manage_audit_logs'), auditLogController.exportAuditLogs);
router.get('/audit-logs/:id', superAdminOnly, requirePermission('manage_audit_logs'), auditLogController.getAuditLog);

module.exports = router;