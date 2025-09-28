import { User } from '../models/User';
import { Job } from '../models/Job';
import { JobNotification } from '../models/JobNotification';
import { emailService } from '../utils/emailService';
import { logger } from '../utils/logger';
import { 
  findEligibleUsersForJobEnhanced, 
  EnhancedMatchResult, 
  MatchingCriteria,
  DEFAULT_CRITERIA 
} from '../utils/enhancedJobMatching';

export interface EnhancedJobAlertResult {
  jobId: string;
  jobTitle: string;
  company: string;
  totalEligibleUsers: number;
  emailsSent: number;
  emailsFailed: number;
  duplicateNotifications: number;
  averageMatchPercentage: number;
  userMatches: {
    email: string;
    matchPercentage: number;
    emailSent: boolean;
    emailStatus: 'sent' | 'failed' | 'duplicate';
  }[];
  dryRun: boolean;
}

export interface EnhancedJobAlertOptions {
  jobId: string;
  minimumMatchPercentage?: number;
  maxUsers?: number;
  dryRun?: boolean;
  customCriteria?: Partial<MatchingCriteria>;
}

/**
 * Send job alerts using enhanced percentage-based matching
 */
export const sendJobAlertsEnhanced = async (
  options: EnhancedJobAlertOptions
): Promise<EnhancedJobAlertResult> => {
  const {
    jobId,
    minimumMatchPercentage = 50,
    maxUsers = 100,
    dryRun = false,
    customCriteria = {}
  } = options;

  // Initialize result
  const result: EnhancedJobAlertResult = {
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
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    result.jobTitle = job.title;
    result.company = job.company;

    logger.info('Starting enhanced job alert process', {
      jobId,
      jobTitle: job.title,
      company: job.company,
      minimumMatchPercentage,
      maxUsers,
      dryRun
    });

    // Find eligible users using enhanced matching
    const eligibleUsers = await findEligibleUsersForJobEnhanced(jobId, {
      minimumMatchPercentage,
      maxUsers,
      criteria: customCriteria
    });

    result.totalEligibleUsers = eligibleUsers.length;

    if (eligibleUsers.length === 0) {
      logger.info('No eligible users found for job alert', { jobId, jobTitle: job.title });
      return result;
    }

    // Calculate average match percentage
    result.averageMatchPercentage = Math.round(
      (eligibleUsers.reduce((sum, user) => sum + user.matchPercentage, 0) / eligibleUsers.length) * 100
    ) / 100;

    logger.info('Found eligible users for enhanced job alert', {
      jobId,
      totalEligibleUsers: result.totalEligibleUsers,
      averageMatchPercentage: result.averageMatchPercentage,
      dryRun
    });

    // Process each eligible user
    for (const userMatch of eligibleUsers) {
      const userEmail = (userMatch as any).email;
      const userName = (userMatch as any).name;
      const userProfile = (userMatch as any).userProfile;

      // Check for existing notification (prevent duplicates)
      const existingNotification = await JobNotification.findOne({
        userId: userMatch.userId.toString(),
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

        logger.debug('Duplicate notification prevented', {
          userId: userMatch.userId,
          email: userEmail,
          jobId,
          existingStatus: existingNotification.emailStatus
        });
        continue;
      }

      // Create notification record
      const notification = new JobNotification({
        userId: userMatch.userId.toString(),
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
      let emailStatus: 'sent' | 'failed' | 'duplicate' = 'failed';

      if (!dryRun) {
        emailSent = await emailService.sendJobAlertEmail(userEmail, jobData);

        if (emailSent) {
          // Update notification status
          notification.emailStatus = 'sent';
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();

          result.emailsSent++;
          emailStatus = 'sent';

          logger.info('Enhanced job alert email sent successfully', {
            userId: userMatch.userId,
            email: userEmail,
            jobId,
            jobTitle: job.title,
            matchPercentage: userMatch.matchPercentage,
            detailedScores: userMatch.detailedScores
          });
        } else {
          // Update notification status to failed
          notification.emailStatus = 'failed';
          notification.emailSent = false;
          await notification.save();

          result.emailsFailed++;
          emailStatus = 'failed';

          logger.error('Failed to send enhanced job alert email', {
            userId: userMatch.userId,
            email: userEmail,
            jobId,
            jobTitle: job.title,
            matchPercentage: userMatch.matchPercentage
          });
        }
      } else {
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

    logger.info('Enhanced job alert process completed', {
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

  } catch (error) {
    logger.error('Enhanced job alert process failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId,
      dryRun
    });
    throw error;
  }
};

/**
 * Send job alerts for all active jobs using enhanced matching
 */
export const sendAllJobAlertsEnhanced = async (
  options: {
    minimumMatchPercentage?: number;
    maxUsersPerJob?: number;
    dryRun?: boolean;
    customCriteria?: Partial<MatchingCriteria>;
  } = {}
): Promise<{ [jobId: string]: EnhancedJobAlertResult }> => {
  const {
    minimumMatchPercentage = 50,
    maxUsersPerJob = 50,
    dryRun = false,
    customCriteria = {}
  } = options;

  const results: { [jobId: string]: EnhancedJobAlertResult } = {};

  try {
    // Get all active jobs created in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentJobs = await Job.find({
      isActive: true,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });

    logger.info('Processing enhanced job alerts for multiple jobs', {
      totalJobs: recentJobs.length,
      minimumMatchPercentage,
      maxUsersPerJob,
      dryRun
    });

    for (const job of recentJobs) {
      try {
        const jobResult = await sendJobAlertsEnhanced({
          jobId: job._id.toString(),
          minimumMatchPercentage,
          maxUsers: maxUsersPerJob,
          dryRun,
          customCriteria
        });

        results[job._id.toString()] = jobResult;

      } catch (error) {
        logger.error('Failed to process enhanced job alerts for job', {
          jobId: job._id.toString(),
          jobTitle: job.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Enhanced job alerts completed for all jobs', {
      totalJobsProcessed: Object.keys(results).length,
      totalEmailsSent: Object.values(results).reduce((sum, result) => sum + result.emailsSent, 0),
      totalEmailsFailed: Object.values(results).reduce((sum, result) => sum + result.emailsFailed, 0),
      dryRun
    });

    return results;

  } catch (error) {
    logger.error('Enhanced job alerts for all jobs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      dryRun
    });
    throw error;
  }
};

export { DEFAULT_CRITERIA };
