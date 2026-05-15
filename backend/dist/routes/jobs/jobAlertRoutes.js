"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const jobAlertController_1 = require("../../controllers/jobs/jobAlertController");
const router = (0, express_1.Router)();
// Apply auth + admin check to all routes
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
/**
 * POST /api/v1/jobs/alerts/send/:jobId
 * Send job alerts for a specific job
 */
router.post('/send/:jobId', jobAlertController_1.sendJobAlerts);
/**
 * POST /api/v1/jobs/alerts/send-all
 * Send job alerts for all active jobs
 */
router.post('/send-all', jobAlertController_1.sendAllJobAlerts);
/**
 * GET /api/v1/jobs/alerts/statistics
 * Get job alert statistics (optionally filtered by ?jobId=)
 */
router.get('/statistics', jobAlertController_1.getJobAlertStatistics);
/**
 * POST /api/v1/jobs/alerts/retry-failed
 * Retry failed job notifications
 */
router.post('/retry-failed', jobAlertController_1.retryFailedNotifications);
/**
 * GET /api/v1/jobs/alerts/scheduler/status
 * Get cron scheduler status
 */
router.get('/scheduler/status', jobAlertController_1.getSchedulerStatus);
/**
 * POST /api/v1/jobs/alerts/scheduler/trigger
 * Manually trigger a scheduler task
 * Body: { task: 'jobAlerts' | 'retryFailed', dryRun?: boolean }
 */
router.post('/scheduler/trigger', jobAlertController_1.triggerSchedulerTask);
exports.default = router;
//# sourceMappingURL=jobAlertRoutes.js.map