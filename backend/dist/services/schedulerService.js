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
    start() {
        if (!this.config.enabled) {
            logger_1.logger.info('Scheduler disabled (set ENABLE_SCHEDULER=true to enable)');
            return;
        }
        this.startJobAlertTask();
        this.startRetryFailedTask();
        logger_1.logger.info('Scheduler started', {
            jobAlertCron: this.config.jobAlertCron,
            retryFailedCron: this.config.retryFailedCron
        });
    }
    stop() {
        if (this.jobAlertTask) {
            this.jobAlertTask.stop();
            this.jobAlertTask = null;
        }
        if (this.retryFailedTask) {
            this.retryFailedTask.stop();
            this.retryFailedTask = null;
        }
        logger_1.logger.info('Scheduler stopped');
    }
    startJobAlertTask() {
        if (!cron.validate(this.config.jobAlertCron)) {
            logger_1.logger.error('Invalid job alert cron expression', { cron: this.config.jobAlertCron });
            return;
        }
        this.jobAlertTask = cron.schedule(this.config.jobAlertCron, async () => {
            try {
                logger_1.logger.info('⏰ Scheduled job alerts starting...');
                const result = await (0, jobAlertService_1.sendJobAlertsForAllActiveJobs)({
                    minMatchScore: 50,
                    maxUsersPerJob: 100,
                    dryRun: false,
                    isAutomatic: true
                });
                logger_1.logger.info('✅ Scheduled job alerts completed', {
                    totalJobs: result.totalJobs,
                    emailsSent: result.totalEmailsSent,
                    duplicates: result.totalDuplicates
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Scheduled job alerts failed', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.jobAlertTask.start();
        logger_1.logger.info('Job alert task scheduled', { cron: this.config.jobAlertCron });
    }
    startRetryFailedTask() {
        if (!cron.validate(this.config.retryFailedCron)) {
            logger_1.logger.error('Invalid retry failed cron expression', { cron: this.config.retryFailedCron });
            return;
        }
        this.retryFailedTask = cron.schedule(this.config.retryFailedCron, async () => {
            try {
                logger_1.logger.info('⏰ Scheduled retry of failed notifications starting...');
                const result = await (0, jobAlertService_1.retryFailedJobNotifications)();
                logger_1.logger.info('✅ Retry completed', result);
            }
            catch (error) {
                logger_1.logger.error('❌ Retry of failed notifications failed', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.retryFailedTask.start();
        logger_1.logger.info('Retry-failed task scheduled', { cron: this.config.retryFailedCron });
    }
    /** Manual trigger — job alerts for all active jobs */
    async triggerJobAlerts(dryRun = false) {
        logger_1.logger.info('Manual job alerts triggered', { dryRun });
        return (0, jobAlertService_1.sendJobAlertsForAllActiveJobs)({
            minMatchScore: 50,
            maxUsersPerJob: 100,
            dryRun,
            isAutomatic: false
        });
    }
    /** Manual trigger — retry all failed notifications */
    async triggerRetryFailed() {
        logger_1.logger.info('Manual retry of failed notifications triggered');
        return (0, jobAlertService_1.retryFailedJobNotifications)();
    }
    getStatus() {
        return {
            enabled: this.config.enabled,
            jobAlertTaskRunning: this.jobAlertTask !== null,
            retryFailedTaskRunning: this.retryFailedTask !== null,
            config: this.config
        };
    }
}
exports.SchedulerService = SchedulerService;
// ─── Default config ────────────────────────────────────────────────────────────
const defaultConfig = {
    // Daily at 8:00 AM — notify users about all open jobs
    jobAlertCron: process.env.JOB_ALERT_CRON || '0 8 * * *',
    // Daily at 2:00 AM — retry any failed notifications from the day before
    retryFailedCron: process.env.RETRY_CRON || '0 2 * * *',
    // Enable in production, or when explicitly set via env
    enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true'
};
exports.schedulerService = new SchedulerService(defaultConfig);
//# sourceMappingURL=schedulerService.js.map