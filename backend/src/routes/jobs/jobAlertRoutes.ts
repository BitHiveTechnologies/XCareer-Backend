import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  sendJobAlerts,
  sendAllJobAlerts,
  getJobAlertStatistics,
  retryFailedNotifications,
  getSchedulerStatus,
  triggerSchedulerTask
} from '../../controllers/jobs/jobAlertController';

const router = Router();

// Apply auth + admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * POST /api/v1/jobs/alerts/send/:jobId
 * Send job alerts for a specific job
 */
router.post('/send/:jobId', sendJobAlerts);

/**
 * POST /api/v1/jobs/alerts/send-all
 * Send job alerts for all active jobs
 */
router.post('/send-all', sendAllJobAlerts);

/**
 * GET /api/v1/jobs/alerts/statistics
 * Get job alert statistics (optionally filtered by ?jobId=)
 */
router.get('/statistics', getJobAlertStatistics);

/**
 * POST /api/v1/jobs/alerts/retry-failed
 * Retry failed job notifications
 */
router.post('/retry-failed', retryFailedNotifications);

/**
 * GET /api/v1/jobs/alerts/scheduler/status
 * Get cron scheduler status
 */
router.get('/scheduler/status', getSchedulerStatus);

/**
 * POST /api/v1/jobs/alerts/scheduler/trigger
 * Manually trigger a scheduler task
 * Body: { task: 'jobAlerts' | 'retryFailed', dryRun?: boolean }
 */
router.post('/scheduler/trigger', triggerSchedulerTask);

export default router;
