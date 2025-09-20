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
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map