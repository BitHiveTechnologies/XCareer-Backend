"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../../controllers/admin/adminController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
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
 * @route   POST /api/v1/admin/jobs/:jobId/notify
 * @desc    Trigger job matching and notifications for a specific job
 * @access  Admin only
 */
router.post('/jobs/:jobId/notify', adminController_1.notifyUsersForJob);
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin only
 */
router.get('/users', adminController_1.getAllUsers);
/**
 * @route   GET /api/v1/admin/payments
 * @desc    Get all payment history (admin only)
 * @access  Admin only
 */
router.get('/payments', adminController_1.getAllPayments);
/**
 * @route   GET /api/v1/admin/customers
 * @desc    Get all customers (admin only)
 * @access  Admin only
 */
router.get('/customers', adminController_1.getAllCustomers);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map