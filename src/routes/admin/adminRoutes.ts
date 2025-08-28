import { Router } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../../middleware/clerkAuth';
import * as adminController from '../../controllers/admin/adminController';
import * as userManagementController from '../../controllers/admin/userManagementController';
import * as jobManagementController from '../../controllers/admin/jobManagementController';
import * as subscriptionManagementController from '../../controllers/admin/subscriptionManagementController';
import * as auditLogController from '../../controllers/admin/auditLogController';
import { validateRequest } from '../../middleware/validation';
import Joi from 'joi';

const router = Router();

// Apply admin authentication middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// ============================================================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Admin, Super Admin
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/dashboard/user-analytics
 * @desc    Get user analytics and metrics
 * @access  Admin, Super Admin
 */
router.get('/dashboard/user-analytics', adminController.getUserAnalytics);

/**
 * @route   GET /api/v1/admin/dashboard/job-analytics
 * @desc    Get job analytics and metrics
 * @access  Admin, Super Admin
 */
router.get('/dashboard/job-analytics', adminController.getJobAnalytics);

/**
 * @route   GET /api/v1/admin/dashboard/system-health
 * @desc    Get system health and performance metrics
 * @access  Admin, Super Admin
 */
router.get('/dashboard/system-health', adminController.getSystemHealth);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin, Super Admin
 */
router.get('/users', userManagementController.getAllUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get user details by ID
 * @access  Admin, Super Admin
 */
router.get('/users/:userId', userManagementController.getUserById);

/**
 * @route   PUT /api/v1/admin/users/:userId
 * @desc    Update user role and status
 * @access  Admin, Super Admin
 */
router.put('/users/:userId', 
  validateRequest({
    body: Joi.object({
      role: Joi.string().valid('user', 'admin', 'super_admin'),
      isActive: Joi.boolean(),
      subscriptionStatus: Joi.string().valid('active', 'inactive', 'cancelled', 'expired')
    })
  }),
  userManagementController.updateUserRole
);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete user (soft delete)
 * @access  Admin, Super Admin
 */
router.delete('/users/:userId',
  validateRequest({
    body: Joi.object({
      reason: Joi.string().optional()
    })
  }),
  userManagementController.deleteUser
);

/**
 * @route   POST /api/v1/admin/users/bulk-update
 * @desc    Bulk update users
 * @access  Admin, Super Admin
 */
router.post('/users/bulk-update',
  validateRequest({
    body: Joi.object({
      userIds: Joi.array().items(Joi.string().required()).min(1).required(),
      updates: Joi.object({
        role: Joi.string().valid('user', 'admin', 'super_admin'),
        isActive: Joi.boolean(),
        subscriptionStatus: Joi.string().valid('active', 'inactive', 'cancelled', 'expired')
      }).required()
    })
  }),
  userManagementController.bulkUpdateUsers
);

/**
 * @route   GET /api/v1/admin/users/:userId/activity
 * @desc    Get user activity and engagement metrics
 * @access  Admin, Super Admin
 */
router.get('/users/:userId/activity', userManagementController.getUserActivity);

// ============================================================================
// JOB MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/jobs
 * @desc    Get all jobs with pagination and filtering
 * @access  Admin, Super Admin
 */
router.get('/jobs', jobManagementController.getAllJobs);

/**
 * @route   GET /api/v1/admin/jobs/:jobId
 * @desc    Get job details by ID with applications
 * @access  Admin, Super Admin
 */
router.get('/jobs/:jobId', jobManagementController.getJobById);

/**
 * @route   PUT /api/v1/admin/jobs/:jobId
 * @desc    Update job status and moderation
 * @access  Admin, Super Admin
 */
router.put('/jobs/:jobId',
  validateRequest({
    body: Joi.object({
      status: Joi.string().valid('pending', 'approved', 'rejected', 'expired'),
      isActive: Joi.boolean(),
      moderationNotes: Joi.string().optional(),
      isFeatured: Joi.boolean()
    })
  }),
  jobManagementController.updateJobStatus
);

/**
 * @route   DELETE /api/v1/admin/jobs/:jobId
 * @desc    Delete job (soft delete)
 * @access  Admin, Super Admin
 */
router.delete('/jobs/:jobId',
  validateRequest({
    body: Joi.object({
      reason: Joi.string().optional()
    })
  }),
  jobManagementController.deleteJob
);

/**
 * @route   POST /api/v1/admin/jobs/bulk-update
 * @desc    Bulk update jobs
 * @access  Admin, Super Admin
 */
router.post('/jobs/bulk-update',
  validateRequest({
    body: Joi.object({
      jobIds: Joi.array().items(Joi.string().required()).min(1).required(),
      updates: Joi.object({
        status: Joi.string().valid('pending', 'approved', 'rejected', 'expired'),
        isActive: Joi.boolean(),
        isFeatured: Joi.boolean()
      }).required()
    })
  }),
  jobManagementController.bulkUpdateJobs
);

/**
 * @route   GET /api/v1/admin/jobs/moderation/queue
 * @desc    Get job moderation queue
 * @access  Admin, Super Admin
 */
router.get('/jobs/moderation/queue', jobManagementController.getModerationQueue);

/**
 * @route   GET /api/v1/admin/jobs/:jobId/applications/analytics
 * @desc    Get job application analytics
 * @access  Admin, Super Admin
 */
router.get('/jobs/:jobId/applications/analytics', jobManagementController.getJobApplicationAnalytics);

// ============================================================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/subscriptions
 * @desc    Get all subscriptions with pagination and filtering
 * @access  Admin, Super Admin
 */
router.get('/subscriptions', subscriptionManagementController.getAllSubscriptions);

/**
 * @route   GET /api/v1/admin/subscriptions/:subscriptionId
 * @desc    Get subscription details by ID
 * @access  Admin, Super Admin
 */
router.get('/subscriptions/:subscriptionId', subscriptionManagementController.getSubscriptionById);

/**
 * @route   PUT /api/v1/admin/subscriptions/:subscriptionId
 * @desc    Update subscription status and details
 * @access  Admin, Super Admin
 */
router.put('/subscriptions/:subscriptionId',
  validateRequest({
    body: Joi.object({
      status: Joi.string().valid('active', 'inactive', 'cancelled', 'expired'),
      plan: Joi.string().valid('basic', 'premium', 'enterprise'),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      isActive: Joi.boolean(),
      adminNotes: Joi.string().optional()
    })
  }),
  subscriptionManagementController.updateSubscription
);

/**
 * @route   POST /api/v1/admin/subscriptions/:subscriptionId/cancel
 * @desc    Cancel subscription
 * @access  Admin, Super Admin
 */
router.post('/subscriptions/:subscriptionId/cancel',
  validateRequest({
    body: Joi.object({
      reason: Joi.string().required(),
      refundAmount: Joi.number().min(0).optional()
    })
  }),
  subscriptionManagementController.cancelSubscription
);

/**
 * @route   GET /api/v1/admin/subscriptions/analytics
 * @desc    Get subscription analytics and metrics
 * @access  Admin, Super Admin
 */
router.get('/subscriptions/analytics', subscriptionManagementController.getSubscriptionAnalytics);

/**
 * @route   POST /api/v1/admin/subscriptions/bulk-update
 * @desc    Bulk update subscriptions
 * @access  Admin, Super Admin
 */
router.post('/subscriptions/bulk-update',
  validateRequest({
    body: Joi.object({
      subscriptionIds: Joi.array().items(Joi.string().required()).min(1).required(),
      updates: Joi.object({
        status: Joi.string().valid('active', 'inactive', 'cancelled', 'expired'),
        plan: Joi.string().valid('basic', 'premium', 'enterprise'),
        isActive: Joi.boolean()
      }).required()
    })
  }),
  subscriptionManagementController.bulkUpdateSubscriptions
);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin, Super Admin
 */
router.get('/audit-logs', auditLogController.getAuditLogs);

/**
 * @route   GET /api/v1/admin/audit-logs/recent
 * @desc    Get recent admin activity
 * @access  Admin, Super Admin
 */
router.get('/audit-logs/recent', auditLogController.getRecentActivity);

/**
 * @route   GET /api/v1/admin/audit-logs/admin/:targetAdminId
 * @desc    Get specific admin's activity
 * @access  Admin, Super Admin
 */
router.get('/audit-logs/admin/:targetAdminId', auditLogController.getAdminActivity);

/**
 * @route   GET /api/v1/admin/audit-logs/resource/:resourceType/:resourceId
 * @desc    Get resource activity history
 * @access  Admin, Super Admin
 */
router.get('/audit-logs/resource/:resourceType/:resourceId', auditLogController.getResourceActivity);

/**
 * @route   GET /api/v1/admin/audit-logs/export
 * @desc    Export audit logs (CSV format)
 * @access  Admin, Super Admin
 */
router.get('/audit-logs/export', auditLogController.exportAuditLogs);

// ============================================================================
// SUPER ADMIN ONLY ROUTES
// ============================================================================

// Apply super admin middleware to sensitive operations
router.use('/users/:userId/role', requireSuperAdmin);
router.use('/users/bulk-update', requireSuperAdmin);
router.use('/jobs/:jobId/delete', requireSuperAdmin);
router.use('/subscriptions/:subscriptionId/delete', requireSuperAdmin);

export default router;
