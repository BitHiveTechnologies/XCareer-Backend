import { Router } from 'express';
import {
    analyzeQuery,
    clearMetrics,
    getIndexStats,
    getPerformanceStats,
    getRecentMetrics
} from '../controllers/performanceController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All performance routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route GET /api/v1/performance/stats
 * @desc Get performance statistics
 * @access Admin
 */
router.get('/stats', getPerformanceStats);

/**
 * @route GET /api/v1/performance/metrics
 * @desc Get recent query metrics
 * @access Admin
 */
router.get('/metrics', getRecentMetrics);

/**
 * @route GET /api/v1/performance/indexes
 * @desc Get database index statistics
 * @access Admin
 */
router.get('/indexes', getIndexStats);

/**
 * @route POST /api/v1/performance/analyze
 * @desc Analyze query performance
 * @access Admin
 */
router.post('/analyze', analyzeQuery);

/**
 * @route DELETE /api/v1/performance/clear
 * @desc Clear performance metrics
 * @access Admin
 */
router.delete('/clear', clearMetrics);

export default router;
