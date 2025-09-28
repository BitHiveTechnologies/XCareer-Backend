"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CRITERIA = exports.sendAllJobAlertsEnhanced = exports.sendJobAlertsEnhanced = void 0;
const Job_1 = require("../models/Job");
const JobNotification_1 = require("../models/JobNotification");
const emailService_1 = require("../utils/emailService");
const logger_1 = require("../utils/logger");
const enhancedJobMatching_1 = require("../utils/enhancedJobMatching");
Object.defineProperty(exports, "DEFAULT_CRITERIA", { enumerable: true, get: function () { return enhancedJobMatching_1.DEFAULT_CRITERIA; } });
/**
 * Send job alerts using enhanced percentage-based matching
 */
const sendJobAlertsEnhanced = async (options) => {
    const { jobId, minimumMatchPercentage = 50, maxUsers = 100, dryRun = false, customCriteria = {} } = options;
    // Initialize result
    const result = {
        jobId,
        jobTitle: '',
        company: '',
        totalEligibleUsers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        duplicateNotifications: 0,
        averageMatchPercentage: 0,
        userMatches: [],
        dryRun
    };
    try {
        // Get job details
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        result.jobTitle = job.title;
        result.company = job.company;
        logger_1.logger.info('Starting enhanced job alert process', {
            jobId,
            jobTitle: job.title,
            company: job.company,
            minimumMatchPercentage,
            maxUsers,
            dryRun
        });
        // Find eligible users using enhanced matching
        const eligibleUsers = await (0, enhancedJobMatching_1.findEligibleUsersForJobEnhanced)(jobId, {
            minimumMatchPercentage,
            maxUsers,
            criteria: customCriteria
        });
        result.totalEligibleUsers = eligibleUsers.length;
        if (eligibleUsers.length === 0) {
            logger_1.logger.info('No eligible users found for job alert', { jobId, jobTitle: job.title });
            return result;
        }
        // Calculate average match percentage
        result.averageMatchPercentage = Math.round((eligibleUsers.reduce((sum, user) => sum + user.matchPercentage, 0) / eligibleUsers.length) * 100) / 100;
        logger_1.logger.info('Found eligible users for enhanced job alert', {
            jobId,
            totalEligibleUsers: result.totalEligibleUsers,
            averageMatchPercentage: result.averageMatchPercentage,
            dryRun
        });
        // Process each eligible user
        for (const userMatch of eligibleUsers) {
            const userEmail = userMatch.email;
            const userName = userMatch.name;
            const userProfile = userMatch.userProfile;
            // Check for existing notification (prevent duplicates)
            const existingNotification = await JobNotification_1.JobNotification.findOne({
                userId: userMatch.userId,
                jobId
            });
            if (existingNotification) {
                result.duplicateNotifications++;
                result.userMatches.push({
                    email: userEmail,
                    matchPercentage: userMatch.matchPercentage,
                    emailSent: false,
                    emailStatus: 'duplicate'
                });
                logger_1.logger.debug('Duplicate notification prevented', {
                    userId: userMatch.userId,
                    email: userEmail,
                    jobId,
                    existingStatus: existingNotification.emailStatus
                });
                continue;
            }
            // Create notification record
            const notification = new JobNotification_1.JobNotification({
                userId: userMatch.userId,
                jobId,
                emailStatus: 'pending'
            });
            if (!dryRun) {
                await notification.save();
            }
            // Prepare job data for email template
            const jobData = {
                title: job.title,
                company: job.company,
                location: job.location,
                type: job.type,
                description: job.description,
                applicationLink: job.applicationLink || `https://notifyx.com/jobs/${jobId}/apply`,
                matchPercentage: userMatch.matchPercentage,
                matchReasons: userMatch.matchReasons.slice(0, 3), // Top 3 reasons
                userProfile: {
                    name: userName,
                    qualification: userProfile?.qualification,
                    stream: userProfile?.stream,
                    cgpa: userProfile?.cgpa
                }
            };
            // Send email alert (if not dry run)
            let emailSent = false;
            let emailStatus = 'failed';
            if (!dryRun) {
                emailSent = await emailService_1.emailService.sendJobAlertEmail(userEmail, jobData);
                if (emailSent) {
                    // Update notification status
                    notification.emailStatus = 'sent';
                    notification.emailSent = true;
                    notification.emailSentAt = new Date();
                    await notification.save();
                    result.emailsSent++;
                    emailStatus = 'sent';
                    logger_1.logger.info('Enhanced job alert email sent successfully', {
                        userId: userMatch.userId,
                        email: userEmail,
                        jobId,
                        jobTitle: job.title,
                        matchPercentage: userMatch.matchPercentage,
                        detailedScores: userMatch.detailedScores
                    });
                }
                else {
                    // Update notification status to failed
                    notification.emailStatus = 'failed';
                    notification.emailSent = false;
                    await notification.save();
                    result.emailsFailed++;
                    emailStatus = 'failed';
                    logger_1.logger.error('Failed to send enhanced job alert email', {
                        userId: userMatch.userId,
                        email: userEmail,
                        jobId,
                        jobTitle: job.title,
                        matchPercentage: userMatch.matchPercentage
                    });
                }
            }
            else {
                // Dry run - assume success
                emailSent = true;
                emailStatus = 'sent';
                result.emailsSent++;
            }
            // Add to user matches
            result.userMatches.push({
                email: userEmail,
                matchPercentage: userMatch.matchPercentage,
                emailSent,
                emailStatus
            });
        }
        logger_1.logger.info('Enhanced job alert process completed', {
            jobId,
            jobTitle: job.title,
            result: {
                totalEligibleUsers: result.totalEligibleUsers,
                emailsSent: result.emailsSent,
                emailsFailed: result.emailsFailed,
                duplicateNotifications: result.duplicateNotifications,
                averageMatchPercentage: result.averageMatchPercentage
            },
            dryRun
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Enhanced job alert process failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId,
            dryRun
        });
        throw error;
    }
};
exports.sendJobAlertsEnhanced = sendJobAlertsEnhanced;
/**
 * Send job alerts for all active jobs using enhanced matching
 */
const sendAllJobAlertsEnhanced = async (options = {}) => {
    const { minimumMatchPercentage = 50, maxUsersPerJob = 50, dryRun = false, customCriteria = {} } = options;
    const results = {};
    try {
        // Get all active jobs created in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentJobs = await Job_1.Job.find({
            isActive: true,
            createdAt: { $gte: oneDayAgo }
        }).sort({ createdAt: -1 });
        logger_1.logger.info('Processing enhanced job alerts for multiple jobs', {
            totalJobs: recentJobs.length,
            minimumMatchPercentage,
            maxUsersPerJob,
            dryRun
        });
        for (const job of recentJobs) {
            try {
                const jobResult = await (0, exports.sendJobAlertsEnhanced)({
                    jobId: job._id.toString(),
                    minimumMatchPercentage,
                    maxUsers: maxUsersPerJob,
                    dryRun,
                    customCriteria
                });
                results[job._id.toString()] = jobResult;
            }
            catch (error) {
                logger_1.logger.error('Failed to process enhanced job alerts for job', {
                    jobId: job._id.toString(),
                    jobTitle: job.title,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        logger_1.logger.info('Enhanced job alerts completed for all jobs', {
            totalJobsProcessed: Object.keys(results).length,
            totalEmailsSent: Object.values(results).reduce((sum, result) => sum + result.emailsSent, 0),
            totalEmailsFailed: Object.values(results).reduce((sum, result) => sum + result.emailsFailed, 0),
            dryRun
        });
        return results;
    }
    catch (error) {
        logger_1.logger.error('Enhanced job alerts for all jobs failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dryRun
        });
        throw error;
    }
};
exports.sendAllJobAlertsEnhanced = sendAllJobAlertsEnhanced;
//# sourceMappingURL=enhancedJobAlertService.js.map