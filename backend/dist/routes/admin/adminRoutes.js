"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const adminController_1 = require("../../controllers/admin/adminController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const validation_1 = require("../../middleware/validation");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(jwtAuth_1.authenticate);
router.use(jwtAuth_1.requireAdmin);
/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard', adminController_1.getDashboardStats);
/**
 * @route   GET /api/v1/admin/analytics/users
 * @desc    Get comprehensive user analytics
 * @access  Admin only
 */
router.get('/analytics/users', adminController_1.getUserAnalytics);
/**
 * @route   GET /api/v1/admin/analytics/jobs
 * @desc    Get comprehensive job analytics
 * @access  Admin only
 */
router.get('/analytics/jobs', adminController_1.getJobAnalytics);
/**
 * @route   GET /api/v1/admin/health
 * @desc    Get system health and performance metrics
 * @access  Admin only
 */
router.get('/health', adminController_1.getSystemHealth);
/**
 * @route   GET /api/v1/admin/subscriptions
 * @desc    Get comprehensive subscription management data
 * @access  Admin only
 */
router.get('/subscriptions', adminController_1.getSubscriptionManagement);
/**
 * @route   GET /api/v1/admin/payments
 * @desc    Get payment tracking and analytics
 * @access  Admin only
 */
router.get('/payments', adminController_1.getPaymentTracking);
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get user management data with filtering and pagination
 * @access  Admin only
 */
router.get('/users', adminController_1.getUserManagement);
/**
 * @route   GET /api/v1/admin/content
 * @desc    Get content management data (resume templates)
 * @access  Admin only
 */
router.get('/content', adminController_1.getContentManagement);
/**
 * @route   PUT /api/v1/admin/users/:userId/subscription
 * @desc    Update user subscription status (admin action)
 * @access  Admin only
 */
router.put('/users/:userId/subscription', (0, validation_1.validate)({
    params: joi_1.default.object({
        userId: joi_1.default.string().required()
    }),
    body: joi_1.default.object({
        subscriptionStatus: joi_1.default.string().valid('active', 'inactive', 'expired', 'cancelled').required(),
        subscriptionPlan: joi_1.default.string().valid('basic', 'premium', 'enterprise').optional(),
        reason: joi_1.default.string().max(500).optional()
    })
}), adminController_1.updateUserSubscription);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map