"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../../middleware/validation");
const auth_1 = require("../../middleware/auth");
const jobAlertController_1 = require("../../controllers/jobs/jobAlertController");
const router = (0, express_1.Router)();
// Apply authentication and admin authorization to all routes
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
/**
 * @route POST /api/jobs/alerts/send/:jobId
 * @desc Send job alerts for a specific job
 * @access Admin only
 */
router.post('/send/:jobId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.required()
    }),
    body: validation_1.commonSchemas.object({
        minMatchScore: validation_1.commonSchemas.number().integer().min(0).max(100).optional(),
        maxUsers: validation_1.commonSchemas.number().integer().min(1).max(1000).optional(),
        dryRun: validation_1.commonSchemas.boolean().optional()
    })
}), jobAlertController_1.sendJobAlerts);
/**
 * @route POST /api/jobs/alerts/send-all
 * @desc Send job alerts for all active jobs
 * @access Admin only
 */
router.post('/send-all', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        minMatchScore: validation_1.commonSchemas.number().integer().min(0).max(100).optional(),
        maxUsersPerJob: validation_1.commonSchemas.number().integer().min(1).max(1000).optional(),
        dryRun: validation_1.commonSchemas.boolean().optional()
    })
}), jobAlertController_1.sendAllJobAlerts);
/**
 * @route GET /api/jobs/alerts/statistics
 * @desc Get job alert statistics
 * @access Admin only
 */
router.get('/statistics', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.optional()
    })
}), jobAlertController_1.getJobAlertStatistics);
/**
 * @route POST /api/jobs/alerts/retry-failed
 * @desc Retry failed job notifications
 * @access Admin only
 */
router.post('/retry-failed', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.optional()
    })
}), jobAlertController_1.retryFailedNotifications);
/**
 * @route GET /api/jobs/alerts/scheduler/status
 * @desc Get scheduler status
 * @access Admin only
 */
router.get('/scheduler/status', jobAlertController_1.getSchedulerStatus);
/**
 * @route POST /api/jobs/alerts/scheduler/trigger
 * @desc Manually trigger scheduler tasks
 * @access Admin only
 */
router.post('/scheduler/trigger', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        task: validation_1.commonSchemas.string().valid('jobAlerts', 'retryFailed').required(),
        dryRun: validation_1.commonSchemas.boolean().optional()
    })
}), jobAlertController_1.triggerSchedulerTask);
exports.default = router;
//# sourceMappingURL=jobAlertRoutes.js.map