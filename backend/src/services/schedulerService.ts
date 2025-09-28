import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { sendJobAlertsForAllActiveJobs, retryFailedJobNotifications } from './jobAlertService';

export interface SchedulerConfig {
  jobAlertCron: string;
  retryFailedCron: string;
  enabled: boolean;
}

export class SchedulerService {
  private jobAlertTask: any = null;
  private retryFailedTask: any = null;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Start all scheduled tasks
   */
  public start(): void {
    if (!this.config.enabled) {
      logger.info('Scheduler service disabled');
      return;
    }

    this.startJobAlertTask();
    this.startRetryFailedTask();
    
    logger.info('Scheduler service started', {
      jobAlertCron: this.config.jobAlertCron,
      retryFailedCron: this.config.retryFailedCron
    });
  }

  /**
   * Stop all scheduled tasks
   */
  public stop(): void {
    if (this.jobAlertTask) {
      this.jobAlertTask.stop();
      this.jobAlertTask = null;
    }

    if (this.retryFailedTask) {
      this.retryFailedTask.stop();
      this.retryFailedTask = null;
    }

    logger.info('Scheduler service stopped');
  }

  /**
   * Start job alert task
   */
  private startJobAlertTask(): void {
    if (!cron.validate(this.config.jobAlertCron)) {
      logger.error('Invalid job alert cron expression', {
        cron: this.config.jobAlertCron
      });
      return;
    }

    this.jobAlertTask = cron.schedule(this.config.jobAlertCron, async () => {
      try {
        logger.info('Starting scheduled job alerts');
        
        const results = await sendJobAlertsForAllActiveJobs({
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

        logger.info('Scheduled job alerts completed', {
          totalJobs: Object.keys(results).length,
          totalStats
        });
      } catch (error) {
        logger.error('Scheduled job alerts failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.jobAlertTask.start();
    logger.info('Job alert task scheduled', { cron: this.config.jobAlertCron });
  }

  /**
   * Start retry failed notifications task
   */
  private startRetryFailedTask(): void {
    if (!cron.validate(this.config.retryFailedCron)) {
      logger.error('Invalid retry failed cron expression', {
        cron: this.config.retryFailedCron
      });
      return;
    }

    this.retryFailedTask = cron.schedule(this.config.retryFailedCron, async () => {
      try {
        logger.info('Starting scheduled retry failed notifications');
        
        const result = await retryFailedJobNotifications();

        logger.info('Scheduled retry failed notifications completed', result);
      } catch (error) {
        logger.error('Scheduled retry failed notifications failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.retryFailedTask.start();
    logger.info('Retry failed task scheduled', { cron: this.config.retryFailedCron });
  }

  /**
   * Manually trigger job alerts
   */
  public async triggerJobAlerts(dryRun: boolean = false): Promise<any> {
    try {
      logger.info('Manually triggering job alerts', { dryRun });
      
      const results = await sendJobAlertsForAllActiveJobs({
        minMatchScore: 40,
        maxUsersPerJob: 100,
        dryRun
      });

      logger.info('Manual job alerts completed', { dryRun, results });
      return results;
    } catch (error) {
      logger.error('Manual job alerts failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dryRun
      });
      throw error;
    }
  }

  /**
   * Manually trigger retry failed notifications
   */
  public async triggerRetryFailed(): Promise<any> {
    try {
      logger.info('Manually triggering retry failed notifications');
      
      const result = await retryFailedJobNotifications();

      logger.info('Manual retry failed notifications completed', result);
      return result;
    } catch (error) {
      logger.error('Manual retry failed notifications failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    enabled: boolean;
    jobAlertTask: boolean;
    retryFailedTask: boolean;
    config: SchedulerConfig;
  } {
    return {
      enabled: this.config.enabled,
      jobAlertTask: this.jobAlertTask?.getStatus() === 'scheduled',
      retryFailedTask: this.retryFailedTask?.getStatus() === 'scheduled',
      config: this.config
    };
  }
}

// Default configuration
const defaultConfig: SchedulerConfig = {
  jobAlertCron: '0 */6 * * *', // Every 6 hours
  retryFailedCron: '0 2 * * *', // Daily at 2 AM
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true'
};

// Create and export scheduler instance
export const schedulerService = new SchedulerService(defaultConfig);
