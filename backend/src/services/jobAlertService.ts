import { Job } from '../models/Job';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { JobNotification } from '../models/JobNotification';
import { emailService } from '../utils/emailService';
import { logger } from '../utils/logger';
import { findMatchingUsersForJob } from '../utils/jobMatchingService';
import { checkSubscriptionStatus } from '../utils/subscriptionService';

export interface JobAlertStats {
  totalEligibleUsers: number;
  emailsSent: number;
  emailsFailed: number;
  duplicateNotifications: number;
  usersWithoutProfile: number;
  usersWithInactiveSubscription: number;
}

export interface JobAlertOptions {
  jobId: string;
  minMatchScore?: number;
  maxUsers?: number;
  dryRun?: boolean;
}

/**
 * Send job alerts to eligible users for a specific job
 */
export const sendJobAlertsForJob = async (options: JobAlertOptions): Promise<JobAlertStats> => {
  const { jobId, minMatchScore = 40, maxUsers = 100, dryRun = false } = options;
  
  const stats: JobAlertStats = {
    totalEligibleUsers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    duplicateNotifications: 0,
    usersWithoutProfile: 0,
    usersWithInactiveSubscription: 0
  };

  try {
    // Get the job details
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    if (!job.isActive) {
      throw new Error(`Job ${jobId} is not active`);
    }

    logger.info('Starting job alert process', {
      jobId,
      jobTitle: job.title,
      company: job.company,
      minMatchScore,
      maxUsers,
      dryRun
    });

    // Find matching users using the existing job matching service
    const matchingUsers = await findMatchingUsersForJob(jobId, maxUsers);
    
    // Filter users based on match score
    const eligibleUsers = matchingUsers.filter(user => user.matchScore >= minMatchScore);
    stats.totalEligibleUsers = eligibleUsers.length;

    logger.info('Found eligible users for job alert', {
      jobId,
      totalMatchingUsers: matchingUsers.length,
      eligibleUsers: eligibleUsers.length,
      minMatchScore
    });

    // Process each eligible user
    for (const userMatch of eligibleUsers) {
      try {
        // Check if notification already exists
        const existingNotification = await JobNotification.findOne({
          userId: userMatch.userId,
          jobId: jobId
        });

        if (existingNotification) {
          stats.duplicateNotifications++;
          logger.debug('Duplicate notification prevented', {
            userId: userMatch.userId,
            jobId,
            existingStatus: existingNotification.emailStatus
          });
          continue;
        }

        // Get user details
        const user = await User.findById(userMatch.userId);
        if (!user) {
          logger.warn('User not found for job alert', { userId: userMatch.userId });
          continue;
        }

        // Check if user has completed profile
        if (!user.isProfileComplete) {
          stats.usersWithoutProfile++;
          logger.debug('User profile incomplete, skipping alert', {
            userId: userMatch.userId,
            email: user.email
          });
          continue;
        }

        // Check subscription status
        const subscriptionStatus = await checkSubscriptionStatus(userMatch.userId);
        if (!subscriptionStatus || !subscriptionStatus.isActive) {
          stats.usersWithInactiveSubscription++;
          logger.debug('User subscription inactive, skipping alert', {
            userId: userMatch.userId,
            email: user.email,
            subscriptionStatus: subscriptionStatus?.status
          });
          continue;
        }

        if (dryRun) {
          logger.info('Dry run: Would send alert to user', {
            userId: userMatch.userId,
            email: user.email,
            matchScore: userMatch.matchScore,
            jobTitle: job.title
          });
          stats.emailsSent++;
          continue;
        }

        // Create notification record
        const notification = new JobNotification({
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
        const emailSent = await emailService.sendJobAlertEmail(user.email, jobData);
        
        if (emailSent) {
          // Update notification status
          notification.emailStatus = 'sent';
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
          
          stats.emailsSent++;
          
          logger.info('Job alert email sent successfully', {
            userId: userMatch.userId,
            email: user.email,
            jobId,
            matchScore: userMatch.matchScore
          });
        } else {
          // Update notification status to failed
          notification.emailStatus = 'failed';
          notification.emailSent = false;
          await notification.save();
          
          stats.emailsFailed++;
          
          logger.error('Failed to send job alert email', {
            userId: userMatch.userId,
            email: user.email,
            jobId
          });
        }

      } catch (userError) {
        stats.emailsFailed++;
        logger.error('Error processing user for job alert', {
          error: userError instanceof Error ? userError.message : 'Unknown error',
          userId: userMatch.userId,
          jobId
        });
      }
    }

    logger.info('Job alert process completed', {
      jobId,
      jobTitle: job.title,
      stats,
      dryRun
    });

    return stats;

  } catch (error) {
    logger.error('Job alert process failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId,
      options
    });
    throw error;
  }
};

/**
 * Send job alerts for all active jobs (for scheduled tasks)
 */
export const sendJobAlertsForAllActiveJobs = async (options: {
  minMatchScore?: number;
  maxUsersPerJob?: number;
  dryRun?: boolean;
} = {}): Promise<{ [jobId: string]: JobAlertStats }> => {
  const { minMatchScore = 40, maxUsersPerJob = 100, dryRun = false } = options;
  
  const results: { [jobId: string]: JobAlertStats } = {};

  try {
    // Get all active jobs created in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentJobs = await Job.find({
      isActive: true,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });

    logger.info('Starting job alerts for all recent jobs', {
      totalJobs: recentJobs.length,
      minMatchScore,
      maxUsersPerJob,
      dryRun
    });

    for (const job of recentJobs) {
      try {
        const stats = await sendJobAlertsForJob({
          jobId: job._id.toString(),
          minMatchScore,
          maxUsers: maxUsersPerJob,
          dryRun
        });
        
        results[job._id.toString()] = stats;
        
        logger.info('Job alerts completed for job', {
          jobId: job._id.toString(),
          jobTitle: job.title,
          stats
        });
      } catch (jobError) {
        logger.error('Failed to send alerts for job', {
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

    logger.info('Job alerts process completed for all jobs', {
      totalJobs: recentJobs.length,
      results: Object.keys(results).length,
      dryRun
    });

    return results;

  } catch (error) {
    logger.error('Job alerts process failed for all jobs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      options
    });
    throw error;
  }
};

/**
 * Get job alert statistics
 */
export const getJobAlertStats = async (jobId?: string): Promise<{
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  averageMatchScore: number;
  topMatchReasons: string[];
}> => {
  try {
    const query = jobId ? { jobId } : {};
    
    const notifications = await JobNotification.find(query);
    
    const totalNotifications = notifications.length;
    const sentNotifications = notifications.filter(n => n.emailStatus === 'sent').length;
    const failedNotifications = notifications.filter(n => n.emailStatus === 'failed').length;
    const pendingNotifications = notifications.filter(n => n.emailStatus === 'pending').length;
    
    // Since matchScore and matchReasons are not stored in the model,
    // we'll return 0 for averageMatchScore and empty array for topMatchReasons
    const averageMatchScore = 0;
    const topMatchReasons: string[] = [];

    return {
      totalNotifications,
      sentNotifications,
      failedNotifications,
      pendingNotifications,
      averageMatchScore: Math.round(averageMatchScore * 100) / 100,
      topMatchReasons
    };
  } catch (error) {
    logger.error('Get job alert stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};

/**
 * Retry failed job notifications
 */
export const retryFailedJobNotifications = async (jobId?: string): Promise<{
  retried: number;
  successful: number;
  failed: number;
}> => {
  const result = { retried: 0, successful: 0, failed: 0 };
  
  try {
    const query = jobId ? { jobId, emailStatus: 'failed' } : { emailStatus: 'failed' };
    const failedNotifications = await JobNotification.find(query);
    
    logger.info('Retrying failed job notifications', {
      totalFailed: failedNotifications.length,
      jobId
    });

    for (const notification of failedNotifications) {
      try {
        result.retried++;
        
        // Get user and job details
        const user = await User.findById(notification.userId);
        const job = await Job.findById(notification.jobId);
        
        if (!user || !job) {
          logger.warn('User or job not found for retry', {
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
        const emailSent = await emailService.sendJobAlertEmail(user.email, jobData);
        
        if (emailSent) {
          notification.emailStatus = 'sent';
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
          result.successful++;
          
          logger.info('Retry successful for job notification', {
            notificationId: notification._id,
            userId: notification.userId,
            email: user.email
          });
        } else {
          result.failed++;
          logger.error('Retry failed for job notification', {
            notificationId: notification._id,
            userId: notification.userId,
            email: user.email
          });
        }
      } catch (retryError) {
        result.failed++;
        logger.error('Error retrying job notification', {
          error: retryError instanceof Error ? retryError.message : 'Unknown error',
          notificationId: notification._id,
          userId: notification.userId
        });
      }
    }

    logger.info('Job notification retry process completed', result);
    return result;

  } catch (error) {
    logger.error('Retry failed job notifications failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};
