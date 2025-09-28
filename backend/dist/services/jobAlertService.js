"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFailedJobNotifications = exports.getJobAlertStats = exports.sendJobAlertsForAllActiveJobs = exports.sendJobAlertsForJob = void 0;
const Job_1 = require("../models/Job");
const User_1 = require("../models/User");
const JobNotification_1 = require("../models/JobNotification");
const emailService_1 = require("../utils/emailService");
const logger_1 = require("../utils/logger");
const jobMatchingService_1 = require("../utils/jobMatchingService");
const subscriptionService_1 = require("../utils/subscriptionService");
/**
 * Send job alerts to eligible users for a specific job
 */
const sendJobAlertsForJob = async (options) => {
    const { jobId, minMatchScore = 40, maxUsers = 100, dryRun = false } = options;
    const stats = {
        totalEligibleUsers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        duplicateNotifications: 0,
        usersWithoutProfile: 0,
        usersWithInactiveSubscription: 0
    };
    try {
        // Get the job details
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            throw new Error(`Job with ID ${jobId} not found`);
        }
        if (!job.isActive) {
            throw new Error(`Job ${jobId} is not active`);
        }
        logger_1.logger.info('Starting job alert process', {
            jobId,
            jobTitle: job.title,
            company: job.company,
            minMatchScore,
            maxUsers,
            dryRun
        });
        // Find matching users using the existing job matching service
        const matchingUsers = await (0, jobMatchingService_1.findMatchingUsersForJob)(jobId, maxUsers);
        // Filter users based on match score
        const eligibleUsers = matchingUsers.filter(user => user.matchScore >= minMatchScore);
        stats.totalEligibleUsers = eligibleUsers.length;
        logger_1.logger.info('Found eligible users for job alert', {
            jobId,
            totalMatchingUsers: matchingUsers.length,
            eligibleUsers: eligibleUsers.length,
            minMatchScore
        });
        // Process each eligible user
        for (const userMatch of eligibleUsers) {
            try {
                // Check if notification already exists
                const existingNotification = await JobNotification_1.JobNotification.findOne({
                    userId: userMatch.userId,
                    jobId: jobId
                });
                if (existingNotification) {
                    stats.duplicateNotifications++;
                    logger_1.logger.debug('Duplicate notification prevented', {
                        userId: userMatch.userId,
                        jobId,
                        existingStatus: existingNotification.emailStatus
                    });
                    continue;
                }
                // Get user details
                const user = await User_1.User.findById(userMatch.userId);
                if (!user) {
                    logger_1.logger.warn('User not found for job alert', { userId: userMatch.userId });
                    continue;
                }
                // Check if user has completed profile
                if (!user.isProfileComplete) {
                    stats.usersWithoutProfile++;
                    logger_1.logger.debug('User profile incomplete, skipping alert', {
                        userId: userMatch.userId,
                        email: user.email
                    });
                    continue;
                }
                // Check subscription status
                const subscriptionStatus = await (0, subscriptionService_1.checkSubscriptionStatus)(userMatch.userId);
                if (!subscriptionStatus || !subscriptionStatus.isActive) {
                    stats.usersWithInactiveSubscription++;
                    logger_1.logger.debug('User subscription inactive, skipping alert', {
                        userId: userMatch.userId,
                        email: user.email,
                        subscriptionStatus: subscriptionStatus?.status
                    });
                    continue;
                }
                if (dryRun) {
                    logger_1.logger.info('Dry run: Would send alert to user', {
                        userId: userMatch.userId,
                        email: user.email,
                        matchScore: userMatch.matchScore,
                        jobTitle: job.title
                    });
                    stats.emailsSent++;
                    continue;
                }
                // Create notification record
                const notification = new JobNotification_1.JobNotification({
                    userId: userMatch.userId,
                    jobId: jobId,
                    emailStatus: 'pending'
                });
                await notification.save();
                // Prepare job data for email template
                const jobData = {
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    type: job.type,
                    description: job.description,
                    applicationLink: job.applicationLink
                };
                // Send email alert
                const emailSent = await emailService_1.emailService.sendJobAlertEmail(user.email, jobData);
                if (emailSent) {
                    // Update notification status
                    notification.emailStatus = 'sent';
                    notification.emailSent = true;
                    notification.emailSentAt = new Date();
                    await notification.save();
                    stats.emailsSent++;
                    logger_1.logger.info('Job alert email sent successfully', {
                        userId: userMatch.userId,
                        email: user.email,
                        jobId,
                        matchScore: userMatch.matchScore
                    });
                }
                else {
                    // Update notification status to failed
                    notification.emailStatus = 'failed';
                    notification.emailSent = false;
                    await notification.save();
                    stats.emailsFailed++;
                    logger_1.logger.error('Failed to send job alert email', {
                        userId: userMatch.userId,
                        email: user.email,
                        jobId
                    });
                }
            }
            catch (userError) {
                stats.emailsFailed++;
                logger_1.logger.error('Error processing user for job alert', {
                    error: userError instanceof Error ? userError.message : 'Unknown error',
                    userId: userMatch.userId,
                    jobId
                });
            }
        }
        logger_1.logger.info('Job alert process completed', {
            jobId,
            jobTitle: job.title,
            stats,
            dryRun
        });
        return stats;
    }
    catch (error) {
        logger_1.logger.error('Job alert process failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId,
            options
        });
        throw error;
    }
};
exports.sendJobAlertsForJob = sendJobAlertsForJob;
/**
 * Send job alerts for all active jobs (for scheduled tasks)
 */
const sendJobAlertsForAllActiveJobs = async (options = {}) => {
    const { minMatchScore = 40, maxUsersPerJob = 100, dryRun = false } = options;
    const results = {};
    try {
        // Get all active jobs created in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentJobs = await Job_1.Job.find({
            isActive: true,
            createdAt: { $gte: oneDayAgo }
        }).sort({ createdAt: -1 });
        logger_1.logger.info('Starting job alerts for all recent jobs', {
            totalJobs: recentJobs.length,
            minMatchScore,
            maxUsersPerJob,
            dryRun
        });
        for (const job of recentJobs) {
            try {
                const stats = await (0, exports.sendJobAlertsForJob)({
                    jobId: job._id.toString(),
                    minMatchScore,
                    maxUsers: maxUsersPerJob,
                    dryRun
                });
                results[job._id.toString()] = stats;
                logger_1.logger.info('Job alerts completed for job', {
                    jobId: job._id.toString(),
                    jobTitle: job.title,
                    stats
                });
            }
            catch (jobError) {
                logger_1.logger.error('Failed to send alerts for job', {
                    error: jobError instanceof Error ? jobError.message : 'Unknown error',
                    jobId: job._id.toString(),
                    jobTitle: job.title
                });
                results[job._id.toString()] = {
                    totalEligibleUsers: 0,
                    emailsSent: 0,
                    emailsFailed: 1,
                    duplicateNotifications: 0,
                    usersWithoutProfile: 0,
                    usersWithInactiveSubscription: 0
                };
            }
        }
        logger_1.logger.info('Job alerts process completed for all jobs', {
            totalJobs: recentJobs.length,
            results: Object.keys(results).length,
            dryRun
        });
        return results;
    }
    catch (error) {
        logger_1.logger.error('Job alerts process failed for all jobs', {
            error: error instanceof Error ? error.message : 'Unknown error',
            options
        });
        throw error;
    }
};
exports.sendJobAlertsForAllActiveJobs = sendJobAlertsForAllActiveJobs;
/**
 * Get job alert statistics
 */
const getJobAlertStats = async (jobId) => {
    try {
        const query = jobId ? { jobId } : {};
        const notifications = await JobNotification_1.JobNotification.find(query);
        const totalNotifications = notifications.length;
        const sentNotifications = notifications.filter(n => n.emailStatus === 'sent').length;
        const failedNotifications = notifications.filter(n => n.emailStatus === 'failed').length;
        const pendingNotifications = notifications.filter(n => n.emailStatus === 'pending').length;
        // Since matchScore and matchReasons are not stored in the model,
        // we'll return 0 for averageMatchScore and empty array for topMatchReasons
        const averageMatchScore = 0;
        const topMatchReasons = [];
        return {
            totalNotifications,
            sentNotifications,
            failedNotifications,
            pendingNotifications,
            averageMatchScore: Math.round(averageMatchScore * 100) / 100,
            topMatchReasons
        };
    }
    catch (error) {
        logger_1.logger.error('Get job alert stats failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId
        });
        throw error;
    }
};
exports.getJobAlertStats = getJobAlertStats;
/**
 * Retry failed job notifications
 */
const retryFailedJobNotifications = async (jobId) => {
    const result = { retried: 0, successful: 0, failed: 0 };
    try {
        const query = jobId ? { jobId, emailStatus: 'failed' } : { emailStatus: 'failed' };
        const failedNotifications = await JobNotification_1.JobNotification.find(query);
        logger_1.logger.info('Retrying failed job notifications', {
            totalFailed: failedNotifications.length,
            jobId
        });
        for (const notification of failedNotifications) {
            try {
                result.retried++;
                // Get user and job details
                const user = await User_1.User.findById(notification.userId);
                const job = await Job_1.Job.findById(notification.jobId);
                if (!user || !job) {
                    logger_1.logger.warn('User or job not found for retry', {
                        notificationId: notification._id,
                        userId: notification.userId,
                        jobId: notification.jobId
                    });
                    result.failed++;
                    continue;
                }
                // Prepare job data for email template
                const jobData = {
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    type: job.type,
                    description: job.description,
                    applicationLink: job.applicationLink
                };
                // Retry sending email
                const emailSent = await emailService_1.emailService.sendJobAlertEmail(user.email, jobData);
                if (emailSent) {
                    notification.emailStatus = 'sent';
                    notification.emailSent = true;
                    notification.emailSentAt = new Date();
                    await notification.save();
                    result.successful++;
                    logger_1.logger.info('Retry successful for job notification', {
                        notificationId: notification._id,
                        userId: notification.userId,
                        email: user.email
                    });
                }
                else {
                    result.failed++;
                    logger_1.logger.error('Retry failed for job notification', {
                        notificationId: notification._id,
                        userId: notification.userId,
                        email: user.email
                    });
                }
            }
            catch (retryError) {
                result.failed++;
                logger_1.logger.error('Error retrying job notification', {
                    error: retryError instanceof Error ? retryError.message : 'Unknown error',
                    notificationId: notification._id,
                    userId: notification.userId
                });
            }
        }
        logger_1.logger.info('Job notification retry process completed', result);
        return result;
    }
    catch (error) {
        logger_1.logger.error('Retry failed job notifications failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId
        });
        throw error;
    }
};
exports.retryFailedJobNotifications = retryFailedJobNotifications;
//# sourceMappingURL=jobAlertService.js.map