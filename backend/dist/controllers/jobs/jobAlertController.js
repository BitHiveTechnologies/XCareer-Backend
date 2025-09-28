"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSchedulerTask = exports.getSchedulerStatus = exports.retryFailedNotifications = exports.getJobAlertStatistics = exports.sendAllJobAlerts = exports.sendJobAlerts = void 0;
const logger_1 = require("../../utils/logger");
const enhancedJobAlertService_1 = require("../../services/enhancedJobAlertService");
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
        const result = await (0, enhancedJobAlertService_1.sendJobAlertsEnhanced)({
            jobId,
            minimumMatchPercentage: minMatchScore,
            maxUsers,
            dryRun
        });
        const stats = {
            totalEligibleUsers: result.totalEligibleUsers,
            emailsSent: result.emailsSent,
            emailsFailed: result.emailsFailed,
            duplicateNotifications: result.duplicateNotifications,
            usersWithoutProfile: 0, // Enhanced service doesn't track this separately
            usersWithInactiveSubscription: 0 // Enhanced service doesn't track this separately
        };
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
        // Get all active jobs and send alerts for each
        const { Job } = await Promise.resolve().then(() => __importStar(require('../../models/Job')));
        const activeJobs = await Job.find({ isActive: true });
        const results = {};
        let totalStats = {
            totalEligibleUsers: 0,
            emailsSent: 0,
            emailsFailed: 0,
            duplicateNotifications: 0,
            usersWithoutProfile: 0,
            usersWithInactiveSubscription: 0
        };
        for (const job of activeJobs) {
            try {
                const result = await (0, enhancedJobAlertService_1.sendJobAlertsEnhanced)({
                    jobId: job._id.toString(),
                    minimumMatchPercentage: minMatchScore,
                    maxUsers: maxUsersPerJob,
                    dryRun
                });
                results[job._id.toString()] = {
                    totalEligibleUsers: result.totalEligibleUsers,
                    emailsSent: result.emailsSent,
                    emailsFailed: result.emailsFailed,
                    duplicateNotifications: result.duplicateNotifications,
                    usersWithoutProfile: 0,
                    usersWithInactiveSubscription: 0
                };
                totalStats.totalEligibleUsers += result.totalEligibleUsers;
                totalStats.emailsSent += result.emailsSent;
                totalStats.emailsFailed += result.emailsFailed;
                totalStats.duplicateNotifications += result.duplicateNotifications;
            }
            catch (error) {
                logger_1.logger.error('Failed to send alerts for job', {
                    jobId: job._id.toString(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                results[job._id.toString()] = {
                    totalEligibleUsers: 0,
                    emailsSent: 0,
                    emailsFailed: 0,
                    duplicateNotifications: 0,
                    usersWithoutProfile: 0,
                    usersWithInactiveSubscription: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
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