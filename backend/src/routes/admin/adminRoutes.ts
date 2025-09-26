import { Router } from 'express';
import Joi from 'joi';
import {
    getContentManagement,
    getDashboardStats,
    getJobAnalytics,
    getPaymentTracking,
    getSubscriptionManagement,
    getSystemHealth,
    getUserAnalytics,
    getUserManagement,
    updateUserSubscription
} from '../../controllers/admin/adminController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import { validate } from '../../middleware/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/v1/admin/analytics/users
 * @desc    Get comprehensive user analytics
 * @access  Admin only
 */
router.get('/analytics/users', getUserAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/jobs
 * @desc    Get comprehensive job analytics
 * @access  Admin only
 */
router.get('/analytics/jobs', getJobAnalytics);

/**
 * @route   GET /api/v1/admin/health
 * @desc    Get system health and performance metrics
 * @access  Admin only
 */
router.get('/health', getSystemHealth);

/**
 * @route   GET /api/v1/admin/subscriptions
 * @desc    Get comprehensive subscription management data
 * @access  Admin only
 */
router.get('/subscriptions', getSubscriptionManagement);

/**
 * @route   GET /api/v1/admin/payments
 * @desc    Get payment tracking and analytics
 * @access  Admin only
 */
router.get('/payments', getPaymentTracking);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get user management data with filtering and pagination
 * @access  Admin only
 */
router.get('/users', getUserManagement);

/**
 * @route   GET /api/v1/admin/content
 * @desc    Get content management data (resume templates)
 * @access  Admin only
 */
router.get('/content', getContentManagement);

/**
 * @route   PUT /api/v1/admin/users/:userId/subscription
 * @desc    Update user subscription status (admin action)
 * @access  Admin only
 */
router.put('/users/:userId/subscription', 
  validate({
    params: Joi.object({
      userId: Joi.string().required()
    }),
    body: Joi.object({
      subscriptionStatus: Joi.string().valid('active', 'inactive', 'expired', 'cancelled').required(),
      subscriptionPlan: Joi.string().valid('basic', 'premium', 'enterprise').optional(),
      reason: Joi.string().max(500).optional()
    })
  }),
  updateUserSubscription
);

export default router;
