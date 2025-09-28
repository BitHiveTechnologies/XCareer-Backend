"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSchedulerTask = exports.getSchedulerStatus = exports.retryFailedNotifications = exports.getJobAlertStatistics = exports.sendAllJobAlerts = exports.sendJobAlerts = void 0;
const logger_1 = require("../../utils/logger");
const jobAlertService_1 = require("../../services/jobAlertService");
const schedulerService_1 = require("../../services/schedulerService");
/**
 * Send job alerts for a specific job
 */
const sendJobAlerts = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { jobId } = req.params;
        const { minMatchScore = 40, maxUsers = 100, dryRun = false } = req.body;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!jobId) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Job ID is required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Manual job alerts triggered', {
            adminId,
            jobId,
            minMatchScore,
            maxUsers,
            dryRun,
            ip: req.ip
        });
        const stats = await (0, jobAlertService_1.sendJobAlertsForJob)({
            jobId,
            minMatchScore,
            maxUsers,
            dryRun
        });
        res.status(200).json({
            success: true,
            message: dryRun ? 'Job alerts dry run completed' : 'Job alerts sent successfully',
            data: {
                jobId,
                stats,
                dryRun
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Send job alerts failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            jobId: req.params.jobId,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to send job alerts'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.sendJobAlerts = sendJobAlerts;
/**
 * Send job alerts for all active jobs
 */
const sendAllJobAlerts = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { minMatchScore = 40, maxUsersPerJob = 100, dryRun = false } = req.body;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Manual all job alerts triggered', {
            adminId,
            minMatchScore,
            maxUsersPerJob,
            dryRun,
            ip: req.ip
        });
        const results = await (0, jobAlertService_1.sendJobAlertsForAllActiveJobs)({
            minMatchScore,
            maxUsersPerJob,
            dryRun
        });
        // Calculate total stats
        const totalStats = Object.values(results).reduce((acc, stats) => ({
            totalEligibleUsers: acc.totalEligibleUsers + stats.totalEligibleUsers,
            emailsSent: acc.emailsSent + stats.emailsSent,
            emailsFailed: acc.emailsFailed + stats.emailsFailed,
            duplicateNotifications: acc.duplicateNotifications + stats.duplicateNotifications,
            usersWithoutProfile: acc.usersWithoutProfile + stats.usersWithoutProfile,
            usersWithInactiveSubscription: acc.usersWithInactiveSubscription + stats.usersWithInactiveSubscription
        }), {
            totalEligibleUsers: 0,
            emailsSent: 0,
            emailsFailed: 0,
            duplicateNotifications: 0,
            usersWithoutProfile: 0,
            usersWithInactiveSubscription: 0
        });
        res.status(200).json({
            success: true,
            message: dryRun ? 'All job alerts dry run completed' : 'All job alerts sent successfully',
            data: {
                totalJobs: Object.keys(results).length,
                totalStats,
                results,
                dryRun
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Send all job alerts failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to send all job alerts'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.sendAllJobAlerts = sendAllJobAlerts;
/**
 * Get job alert statistics
 */
const getJobAlertStatistics = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { jobId } = req.query;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const stats = await (0, jobAlertService_1.getJobAlertStats)(jobId);
        logger_1.logger.info('Job alert statistics retrieved', {
            adminId,
            jobId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                statistics: stats,
                jobId: jobId || 'all'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get job alert statistics failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get job alert statistics'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getJobAlertStatistics = getJobAlertStatistics;
/**
 * Retry failed job notifications
 */
const retryFailedNotifications = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { jobId } = req.body;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Manual retry failed notifications triggered', {
            adminId,
            jobId,
            ip: req.ip
        });
        const result = await (0, jobAlertService_1.retryFailedJobNotifications)(jobId);
        res.status(200).json({
            success: true,
            message: 'Failed notifications retry completed',
            data: {
                result,
                jobId: jobId || 'all'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Retry failed notifications failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retry failed notifications'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.retryFailedNotifications = retryFailedNotifications;
/**
 * Get scheduler status
 */
const getSchedulerStatus = async (req, res) => {
    try {
        const adminId = req.user?.id;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const status = schedulerService_1.schedulerService.getStatus();
        logger_1.logger.info('Scheduler status retrieved', {
            adminId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                status
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get scheduler status failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get scheduler status'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getSchedulerStatus = getSchedulerStatus;
/**
 * Manually trigger scheduler tasks
 */
const triggerSchedulerTask = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { task, dryRun = false } = req.body;
        if (!adminId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!task || !['jobAlerts', 'retryFailed'].includes(task)) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid task. Must be "jobAlerts" or "retryFailed"'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Manual scheduler task triggered', {
            adminId,
            task,
            dryRun,
            ip: req.ip
        });
        let result;
        if (task === 'jobAlerts') {
            result = await schedulerService_1.schedulerService.triggerJobAlerts(dryRun);
        }
        else if (task === 'retryFailed') {
            result = await schedulerService_1.schedulerService.triggerRetryFailed();
        }
        res.status(200).json({
            success: true,
            message: `Scheduler task "${task}" completed successfully`,
            data: {
                task,
                result,
                dryRun
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Trigger scheduler task failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            task: req.body.task,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to trigger scheduler task'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.triggerSchedulerTask = triggerSchedulerTask;
//# sourceMappingURL=jobAlertController.js.map