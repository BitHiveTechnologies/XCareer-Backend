"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const performanceController_1 = require("../controllers/performanceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All performance routes require authentication and admin privileges
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
/**
 * @route GET /api/v1/performance/stats
 * @desc Get performance statistics
 * @access Admin
 */
router.get('/stats', performanceController_1.getPerformanceStats);
/**
 * @route GET /api/v1/performance/metrics
 * @desc Get recent query metrics
 * @access Admin
 */
router.get('/metrics', performanceController_1.getRecentMetrics);
/**
 * @route GET /api/v1/performance/indexes
 * @desc Get database index statistics
 * @access Admin
 */
router.get('/indexes', performanceController_1.getIndexStats);
/**
 * @route POST /api/v1/performance/analyze
 * @desc Analyze query performance
 * @access Admin
 */
router.post('/analyze', performanceController_1.analyzeQuery);
/**
 * @route DELETE /api/v1/performance/clear
 * @desc Clear performance metrics
 * @access Admin
 */
router.delete('/clear', performanceController_1.clearMetrics);
exports.default = router;
//# sourceMappingURL=performanceRoutes.js.map