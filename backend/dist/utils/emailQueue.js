"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueueService = exports.EmailQueueService = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("./logger");
const emailService_1 = require("./emailService");
const emailService_2 = require("./emailService");
// Email queue service
class EmailQueueService {
    constructor() {
        this.isInitialized = false;
        this.initializeQueue();
    }
    initializeQueue() {
        try {
            this.emailQueue = new bull_1.default('email-queue', {
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
            logger_1.logger.info('Email queue initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email queue', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.isInitialized = false;
        }
    }
    setupQueueHandlers() {
        // Process jobs
        this.emailQueue.process(async (job) => {
            const { emailData } = job.data;
            try {
                const success = await emailService_1.emailService.sendEmail(emailData);
                if (success) {
                    logger_1.logger.info('Email job processed successfully', {
                        jobId: job.id,
                        to: emailData.to,
                        template: emailData.template
                    });
                    return { status: emailService_2.EmailStatus.SENT };
                }
                else {
                    throw new Error('Email sending failed');
                }
            }
            catch (error) {
                logger_1.logger.error('Email job processing failed', {
                    jobId: job.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    to: emailData.to
                });
                throw error;
            }
        });
        // Job completion handler
        this.emailQueue.on('completed', (job, result) => {
            logger_1.logger.info('Email job completed', {
                jobId: job.id,
                result
            });
        });
        // Job failure handler
        this.emailQueue.on('failed', (job, error) => {
            logger_1.logger.error('Email job failed', {
                jobId: job.id,
                error: error.message,
                attempts: job.attemptsMade
            });
        });
        // Queue error handler
        this.emailQueue.on('error', (error) => {
            logger_1.logger.error('Email queue error', {
                error: error.message
            });
        });
    }
    async addEmailJob(emailData, options) {
        try {
            if (!this.isInitialized) {
                throw new Error('Email queue not initialized');
            }
            const jobData = {
                emailData,
                attempts: 0,
                maxAttempts: options?.attempts || 3
            };
            const job = await this.emailQueue.add(jobData, {
                delay: options?.delay || 0,
                priority: options?.priority || 0,
                attempts: options?.attempts || 3
            });
            logger_1.logger.info('Email job added to queue', {
                jobId: job.id,
                to: emailData.to,
                template: emailData.template,
                delay: options?.delay || 0
            });
            return job;
        }
        catch (error) {
            logger_1.logger.error('Failed to add email job to queue', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to: emailData.to
            });
            return null;
        }
    }
    async getQueueStatus() {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get queue status', {
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
    async clearQueue() {
        try {
            if (!this.isInitialized) {
                throw new Error('Email queue not initialized');
            }
            await this.emailQueue.empty();
            logger_1.logger.info('Email queue cleared successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to clear email queue', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async closeQueue() {
        try {
            if (this.isInitialized && this.emailQueue) {
                await this.emailQueue.close();
                this.isInitialized = false;
                logger_1.logger.info('Email queue closed successfully');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to close email queue', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.EmailQueueService = EmailQueueService;
exports.emailQueueService = new EmailQueueService();
//# sourceMappingURL=emailQueue.js.map