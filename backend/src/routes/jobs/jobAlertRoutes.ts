import { Router } from 'express';
import { validate, commonSchemas } from '../../middleware/validation';
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

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route POST /api/jobs/alerts/send/:jobId
 * @desc Send job alerts for a specific job
 * @access Admin only
 */
router.post(
  '/send/:jobId',
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      minMatchScore: commonSchemas.number().integer().min(0).max(100).optional(),
      maxUsers: commonSchemas.number().integer().min(1).max(1000).optional(),
      dryRun: commonSchemas.boolean().optional()
    })
  }),
  sendJobAlerts
);

/**
 * @route POST /api/jobs/alerts/send-all
 * @desc Send job alerts for all active jobs
 * @access Admin only
 */
router.post(
  '/send-all',
  validate({
    body: commonSchemas.object({
      minMatchScore: commonSchemas.number().integer().min(0).max(100).optional(),
      maxUsersPerJob: commonSchemas.number().integer().min(1).max(1000).optional(),
      dryRun: commonSchemas.boolean().optional()
    })
  }),
  sendAllJobAlerts
);

/**
 * @route GET /api/jobs/alerts/statistics
 * @desc Get job alert statistics
 * @access Admin only
 */
router.get(
  '/statistics',
  validate({
    query: commonSchemas.object({
      jobId: commonSchemas.objectId.optional()
    })
  }),
  getJobAlertStatistics
);

/**
 * @route POST /api/jobs/alerts/retry-failed
 * @desc Retry failed job notifications
 * @access Admin only
 */
router.post(
  '/retry-failed',
  validate({
    body: commonSchemas.object({
      jobId: commonSchemas.objectId.optional()
    })
  }),
  retryFailedNotifications
);

/**
 * @route GET /api/jobs/alerts/scheduler/status
 * @desc Get scheduler status
 * @access Admin only
 */
router.get(
  '/scheduler/status',
  getSchedulerStatus
);

/**
 * @route POST /api/jobs/alerts/scheduler/trigger
 * @desc Manually trigger scheduler tasks
 * @access Admin only
 */
router.post(
  '/scheduler/trigger',
  validate({
    body: commonSchemas.object({
      task: commonSchemas.string().valid('jobAlerts', 'retryFailed').required(),
      dryRun: commonSchemas.boolean().optional()
    })
  }),
  triggerSchedulerTask
);

export default router;
