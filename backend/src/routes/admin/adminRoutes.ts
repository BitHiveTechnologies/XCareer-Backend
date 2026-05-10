import { Router } from 'express';
import { 
  getDashboardStats, 
  getUserAnalytics, 
  getJobAnalytics, 
  getSystemHealth,
  notifyUsersForJob 
} from '../../controllers/admin/adminController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';

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
 * @route   POST /api/v1/admin/jobs/:jobId/notify
 * @desc    Trigger job matching and notifications for a specific job
 * @access  Admin only
 */
router.post('/jobs/:jobId/notify', notifyUsersForJob);

export default router;
