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
exports.schedulerService = exports.SchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const logger_1 = require("../utils/logger");
const jobAlertService_1 = require("./jobAlertService");
class SchedulerService {
    constructor(config) {
        this.jobAlertTask = null;
        this.retryFailedTask = null;
        this.config = config;
    }
    /**
     * Start all scheduled tasks
     */
    start() {
        if (!this.config.enabled) {
            logger_1.logger.info('Scheduler service disabled');
            return;
        }
        this.startJobAlertTask();
        this.startRetryFailedTask();
        logger_1.logger.info('Scheduler service started', {
            jobAlertCron: this.config.jobAlertCron,
            retryFailedCron: this.config.retryFailedCron
        });
    }
    /**
     * Stop all scheduled tasks
     */
    stop() {
        if (this.jobAlertTask) {
            this.jobAlertTask.stop();
            this.jobAlertTask = null;
        }
        if (this.retryFailedTask) {
            this.retryFailedTask.stop();
            this.retryFailedTask = null;
        }
        logger_1.logger.info('Scheduler service stopped');
    }
    /**
     * Start job alert task
     */
    startJobAlertTask() {
        if (!cron.validate(this.config.jobAlertCron)) {
            logger_1.logger.error('Invalid job alert cron expression', {
                cron: this.config.jobAlertCron
            });
            return;
        }
        this.jobAlertTask = cron.schedule(this.config.jobAlertCron, async () => {
            try {
                logger_1.logger.info('Starting scheduled job alerts');
                const results = await (0, jobAlertService_1.sendJobAlertsForAllActiveJobs)({
                    minMatchScore: 40,
                    maxUsersPerJob: 100,
                    dryRun: false
                });
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
                logger_1.logger.info('Scheduled job alerts completed', {
                    totalJobs: Object.keys(results).length,
                    totalStats
                });
            }
            catch (error) {
                logger_1.logger.error('Scheduled job alerts failed', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.jobAlertTask.start();
        logger_1.logger.info('Job alert task scheduled', { cron: this.config.jobAlertCron });
    }
    /**
     * Start retry failed notifications task
     */
    startRetryFailedTask() {
        if (!cron.validate(this.config.retryFailedCron)) {
            logger_1.logger.error('Invalid retry failed cron expression', {
                cron: this.config.retryFailedCron
            });
            return;
        }
        this.retryFailedTask = cron.schedule(this.config.retryFailedCron, async () => {
            try {
                logger_1.logger.info('Starting scheduled retry failed notifications');
                const result = await (0, jobAlertService_1.retryFailedJobNotifications)();
                logger_1.logger.info('Scheduled retry failed notifications completed', result);
            }
            catch (error) {
                logger_1.logger.error('Scheduled retry failed notifications failed', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.retryFailedTask.start();
        logger_1.logger.info('Retry failed task scheduled', { cron: this.config.retryFailedCron });
    }
    /**
     * Manually trigger job alerts
     */
    async triggerJobAlerts(dryRun = false) {
        try {
            logger_1.logger.info('Manually triggering job alerts', { dryRun });
            const results = await (0, jobAlertService_1.sendJobAlertsForAllActiveJobs)({
                minMatchScore: 40,
                maxUsersPerJob: 100,
                dryRun
            });
            logger_1.logger.info('Manual job alerts completed', { dryRun, results });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Manual job alerts failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                dryRun
            });
            throw error;
        }
    }
    /**
     * Manually trigger retry failed notifications
     */
    async triggerRetryFailed() {
        try {
            logger_1.logger.info('Manually triggering retry failed notifications');
            const result = await (0, jobAlertService_1.retryFailedJobNotifications)();
            logger_1.logger.info('Manual retry failed notifications completed', result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Manual retry failed notifications failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            jobAlertTask: this.jobAlertTask?.getStatus() === 'scheduled',
            retryFailedTask: this.retryFailedTask?.getStatus() === 'scheduled',
            config: this.config
        };
    }
}
exports.SchedulerService = SchedulerService;
// Default configuration
const defaultConfig = {
    jobAlertCron: '0 */6 * * *', // Every 6 hours
    retryFailedCron: '0 2 * * *', // Daily at 2 AM
    enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true'
};
// Create and export scheduler instance
exports.schedulerService = new SchedulerService(defaultConfig);
//# sourceMappingURL=schedulerService.js.map