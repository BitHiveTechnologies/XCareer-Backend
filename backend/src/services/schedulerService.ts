import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { sendJobAlertsForAllActiveJobs, retryFailedJobNotifications } from './jobAlertService';

export interface SchedulerConfig {
  jobAlertCron: string;    // When to run daily job alerts
  retryFailedCron: string; // When to retry failed notifications
  enabled: boolean;
}

export class SchedulerService {
  private jobAlertTask: cron.ScheduledTask | null = null;
  private retryFailedTask: cron.ScheduledTask | null = null;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  public start(): void {
    if (!this.config.enabled) {
      logger.info('Scheduler disabled (set ENABLE_SCHEDULER=true to enable)');
      return;
    }

    this.startJobAlertTask();
    this.startRetryFailedTask();

    logger.info('Scheduler started', {
      jobAlertCron: this.config.jobAlertCron,
      retryFailedCron: this.config.retryFailedCron
    });
  }

  public stop(): void {
    if (this.jobAlertTask) { this.jobAlertTask.stop(); this.jobAlertTask = null; }
    if (this.retryFailedTask) { this.retryFailedTask.stop(); this.retryFailedTask = null; }
    logger.info('Scheduler stopped');
  }

  private startJobAlertTask(): void {
    if (!cron.validate(this.config.jobAlertCron)) {
      logger.error('Invalid job alert cron expression', { cron: this.config.jobAlertCron });
      return;
    }

    this.jobAlertTask = cron.schedule(this.config.jobAlertCron, async () => {
      try {
        logger.info('⏰ Scheduled job alerts starting...');
        const result = await sendJobAlertsForAllActiveJobs({
          minMatchScore: 50,
          maxUsersPerJob: 100,
          dryRun: false,
          isAutomatic: true
        });
        logger.info('✅ Scheduled job alerts completed', {
          totalJobs: result.totalJobs,
          emailsSent: result.totalEmailsSent,
          duplicates: result.totalDuplicates
        });
      } catch (error) {
        logger.error('❌ Scheduled job alerts failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    this.jobAlertTask.start();
    logger.info('Job alert task scheduled', { cron: this.config.jobAlertCron });
  }

  private startRetryFailedTask(): void {
    if (!cron.validate(this.config.retryFailedCron)) {
      logger.error('Invalid retry failed cron expression', { cron: this.config.retryFailedCron });
      return;
    }

    this.retryFailedTask = cron.schedule(this.config.retryFailedCron, async () => {
      try {
        logger.info('⏰ Scheduled retry of failed notifications starting...');
        const result = await retryFailedJobNotifications();
        logger.info('✅ Retry completed', result);
      } catch (error) {
        logger.error('❌ Retry of failed notifications failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    this.retryFailedTask.start();
    logger.info('Retry-failed task scheduled', { cron: this.config.retryFailedCron });
  }

  /** Manual trigger — job alerts for all active jobs */
  public async triggerJobAlerts(dryRun: boolean = false): Promise<any> {
    logger.info('Manual job alerts triggered', { dryRun });
    return sendJobAlertsForAllActiveJobs({
      minMatchScore: 50,
      maxUsersPerJob: 100,
      dryRun,
      isAutomatic: false
    });
  }

  /** Manual trigger — retry all failed notifications */
  public async triggerRetryFailed(): Promise<any> {
    logger.info('Manual retry of failed notifications triggered');
    return retryFailedJobNotifications();
  }

  public getStatus(): {
    enabled: boolean;
    jobAlertTaskRunning: boolean;
    retryFailedTaskRunning: boolean;
    config: SchedulerConfig;
  } {
    return {
      enabled: this.config.enabled,
      jobAlertTaskRunning: this.jobAlertTask !== null,
      retryFailedTaskRunning: this.retryFailedTask !== null,
      config: this.config
    };
  }
}

// ─── Default config ────────────────────────────────────────────────────────────

const defaultConfig: SchedulerConfig = {
  // Daily at 8:00 AM — notify users about all open jobs
  jobAlertCron: process.env.JOB_ALERT_CRON || '0 8 * * *',
  // Daily at 2:00 AM — retry any failed notifications from the day before
  retryFailedCron: process.env.RETRY_CRON || '0 2 * * *',
  // Enable in production, or when explicitly set via env
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true'
};

export const schedulerService = new SchedulerService(defaultConfig);
