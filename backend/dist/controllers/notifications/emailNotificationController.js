"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmailConnection = exports.getEmailQueueStatus = exports.sendJobAlertEmail = exports.sendWelcomeEmail = void 0;
const logger_1 = require("../../utils/logger");
const emailService_1 = require("../../utils/emailService");
const emailQueue_1 = require("../../utils/emailQueue");
const User_1 = require("../../models/User");
const Job_1 = require("../../models/Job");
/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || !name) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Email and name are required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Add email job to queue
        const job = await emailQueue_1.emailQueueService.addEmailJob({
            to: email,
            subject: 'Welcome to NotifyX!',
            template: 'welcome',
            context: { name }
        });
        if (job) {
            logger_1.logger.info('Welcome email queued successfully', {
                jobId: job.id,
                email,
                name
            });
            res.status(200).json({
                success: true,
                data: {
                    message: 'Welcome email queued successfully',
                    jobId: job.id
                },
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to queue welcome email'
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Send welcome email failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email: req.body.email
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to send welcome email'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
/**
 * Send job alert email to user
 */
const sendJobAlertEmail = async (req, res) => {
    try {
        const { userId, jobId } = req.body;
        if (!userId || !jobId) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'User ID and job ID are required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Get user and job details
        const [user, job] = await Promise.all([
            User_1.User.findById(userId),
            Job_1.Job.findById(jobId)
        ]);
        if (!user || !job) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'User or job not found'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Add email job to queue
        const emailJob = await emailQueue_1.emailQueueService.addEmailJob({
            to: user.email,
            subject: `New Job Opportunity: ${job.title}`,
            template: 'job-alert',
            context: {
                jobTitle: job.title,
                companyName: job.company,
                location: job.location,
                jobType: job.type,
                description: job.description,
                applicationLink: job.applicationLink
            }
        });
        if (emailJob) {
            logger_1.logger.info('Job alert email queued successfully', {
                emailJobId: emailJob.id,
                userId: user._id,
                jobId: job._id,
                email: user.email
            });
            res.status(200).json({
                success: true,
                data: {
                    message: 'Job alert email queued successfully',
                    jobId: emailJob.id
                },
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to queue job alert email'
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Send job alert email failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.body.userId,
            jobId: req.body.jobId
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to send job alert email'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.sendJobAlertEmail = sendJobAlertEmail;
/**
 * Get email queue status
 */
const getEmailQueueStatus = async (_req, res) => {
    try {
        const status = await emailQueue_1.emailQueueService.getQueueStatus();
        res.status(200).json({
            success: true,
            data: {
                queueStatus: status
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get email queue status failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get email queue status'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getEmailQueueStatus = getEmailQueueStatus;
/**
 * Test email service connection
 */
const testEmailConnection = async (_req, res) => {
    try {
        const isConnected = await emailService_1.emailService.verifyConnection();
        if (isConnected) {
            res.status(200).json({
                success: true,
                data: {
                    message: 'Email service connection successful',
                    status: 'connected'
                },
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    message: 'Email service connection failed',
                    status: 'disconnected'
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Test email connection failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Email service connection test failed'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.testEmailConnection = testEmailConnection;
//# sourceMappingURL=emailNotificationController.js.map