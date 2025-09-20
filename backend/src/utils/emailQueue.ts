import { logger } from './logger';
import { emailService, EmailData, EmailStatus } from './emailService';

// Email job interface
export interface EmailJobData {
  emailData: EmailData;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  priority?: number;
}

// Simple in-memory email queue without Redis
export class EmailQueueService {
  private isInitialized: boolean = true; // Always initialized since no external dependencies
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalSucceeded: 0
  };

  constructor() {
    logger.info('Simple email queue service initialized (no Redis required)');
  }

  /**
   * Add email job and process immediately (no queuing)
   */
  async addEmailJob(emailData: EmailData, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }): Promise<{ id: string; status: string } | null> {
    try {
      const jobId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const maxAttempts = options?.attempts || 3;

      logger.info('Processing email immediately (no queue)', {
        jobId,
        to: emailData.to,
        template: emailData.template,
        maxAttempts
      });

      // Process email immediately with retry logic
      let success = false;
      let attempts = 0;

      while (attempts < maxAttempts && !success) {
        attempts++;
        
        try {
          success = await emailService.sendEmail(emailData);
          
          if (success) {
            this.stats.totalSucceeded++;
            logger.info('Email sent successfully', {
              jobId,
              to: emailData.to,
              template: emailData.template,
              attempts
            });
            return { id: jobId, status: EmailStatus.SENT };
          } else {
            logger.warn('Email sending failed, retrying...', {
              jobId,
              to: emailData.to,
              attempt: attempts,
              maxAttempts
            });
          }
        } catch (error) {
          logger.error('Email sending attempt failed', {
            jobId,
            to: emailData.to,
            attempt: attempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Wait before retry (exponential backoff)
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // All attempts failed
      this.stats.totalFailed++;
      logger.error('Email sending failed after all attempts', {
        jobId,
        to: emailData.to,
        attempts: maxAttempts
      });

      return { id: jobId, status: EmailStatus.FAILED };

    } catch (error) {
      logger.error('Failed to process email job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to
      });
      return null;
    }
  }

  /**
   * Get queue status (simulated for compatibility)
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return {
      waiting: 0, // No queuing in simple mode
      active: 0,  // No queuing in simple mode
      completed: this.stats.totalSucceeded,
      failed: this.stats.totalFailed,
      delayed: 0  // No queuing in simple mode
    };
  }

  /**
   * Clear queue (no-op for simple mode)
   */
  async clearQueue(): Promise<void> {
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      totalSucceeded: 0
    };
    logger.info('Email queue stats cleared');
  }

  /**
   * Close queue (no-op for simple mode)
   */
  async closeQueue(): Promise<void> {
    logger.info('Email queue service closed (simple mode)');
  }

  /**
   * Get detailed statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalProcessed: this.stats.totalSucceeded + this.stats.totalFailed,
      successRate: this.stats.totalProcessed > 0 
        ? (this.stats.totalSucceeded / (this.stats.totalSucceeded + this.stats.totalFailed) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

export const emailQueueService = new EmailQueueService();
