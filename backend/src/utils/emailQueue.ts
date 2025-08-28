import Queue from 'bull';
import { logger } from './logger';
import { emailService } from './emailService';
import { EmailData, EmailStatus } from './emailService';

// Email queue interface
export interface EmailJobData {
  emailData: EmailData;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  priority?: number;
}

// Email queue service
export class EmailQueueService {
  private emailQueue: Queue.Queue<EmailJobData>;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeQueue();
  }

  private initializeQueue(): void {
    try {
      this.emailQueue = new Queue('email-queue', {
        redis: {
          host: 'localhost',
          port: 6379
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      this.setupQueueHandlers();
      this.isInitialized = true;
      
      logger.info('Email queue initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.isInitialized = false;
    }
  }

  private setupQueueHandlers(): void {
    // Process jobs
    this.emailQueue.process(async (job) => {
      const { emailData } = job.data;
      
      try {
        const success = await emailService.sendEmail(emailData);
        
        if (success) {
          logger.info('Email job processed successfully', {
            jobId: job.id,
            to: emailData.to,
            template: emailData.template
          });
          return { status: EmailStatus.SENT };
        } else {
          throw new Error('Email sending failed');
        }
      } catch (error) {
        logger.error('Email job processing failed', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          to: emailData.to
        });
        throw error;
      }
    });

    // Job completion handler
    this.emailQueue.on('completed', (job, result) => {
      logger.info('Email job completed', {
        jobId: job.id,
        result
      });
    });

    // Job failure handler
    this.emailQueue.on('failed', (job, error) => {
      logger.error('Email job failed', {
        jobId: job.id,
        error: error.message,
        attempts: job.attemptsMade
      });
    });

    // Queue error handler
    this.emailQueue.on('error', (error) => {
      logger.error('Email queue error', {
        error: error.message
      });
    });
  }

  async addEmailJob(emailData: EmailData, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }): Promise<Queue.Job<EmailJobData> | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Email queue not initialized');
      }

      const jobData: EmailJobData = {
        emailData,
        attempts: 0,
        maxAttempts: options?.attempts || 3
      };

      const job = await this.emailQueue.add(jobData, {
        delay: options?.delay || 0,
        priority: options?.priority || 0,
        attempts: options?.attempts || 3
      });

      logger.info('Email job added to queue', {
        jobId: job.id,
        to: emailData.to,
        template: emailData.template,
        delay: options?.delay || 0
      });

      return job;
    } catch (error) {
      logger.error('Failed to add email job to queue', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to
      });
      return null;
    }
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Email queue not initialized');
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
    } catch (error) {
      logger.error('Failed to get queue status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }
  }

  async clearQueue(): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('Email queue not initialized');
      }

      await this.emailQueue.empty();
      logger.info('Email queue cleared successfully');
    } catch (error) {
      logger.error('Failed to clear email queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async closeQueue(): Promise<void> {
    try {
      if (this.isInitialized && this.emailQueue) {
        await this.emailQueue.close();
        this.isInitialized = false;
        logger.info('Email queue closed successfully');
      }
    } catch (error) {
      logger.error('Failed to close email queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const emailQueueService = new EmailQueueService();
