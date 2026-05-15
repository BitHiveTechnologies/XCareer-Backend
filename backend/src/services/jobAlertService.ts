import { Job } from '../models/Job';
import { JobNotification } from '../models/JobNotification';
import { emailService } from '../utils/emailService';
import { logger } from '../utils/logger';
import { findMatchingUsersForJob } from '../utils/jobMatchingService';

export interface JobAlertStats {
  jobId: string;
  jobTitle: string;
  totalEligibleUsers: number;
  emailsSent: number;
  emailsFailed: number;
  duplicateNotifications: number;
  usersWithoutProfile: number;
  usersWithInactiveSubscription: number;
}

export interface JobAlertOptions {
  jobId: string;
  minMatchScore?: number;      // default 50
  maxUsers?: number;           // default 100
  dryRun?: boolean;
  force?: boolean;             // if true, bypass dedup
  isAutomatic?: boolean;       // true = scheduler, false = manual admin
  triggeredBy?: string;        // admin userId if manual
}

export interface BulkAlertResult {
  totalJobs: number;
  totalEligibleUsers: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  totalDuplicates: number;
  perJob: Record<string, JobAlertStats>;
}

// ─── Single-Job Alert ─────────────────────────────────────────────────────────

/**
 * Send job alerts to eligible users for a specific job.
 * - Skips users who already received this job notification (dedup) unless force=true
 * - Skips users with inactive subscriptions
 * - Records matchScore, matchReasons, retryCount in DB
 */
export const sendJobAlertsForJob = async (options: JobAlertOptions): Promise<JobAlertStats> => {
  const {
    jobId,
    minMatchScore = 50,
    maxUsers = 100,
    dryRun = false,
    force = false,
    isAutomatic = true,
    triggeredBy
  } = options;

  const stats: JobAlertStats = {
    jobId,
    jobTitle: '',
    totalEligibleUsers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    duplicateNotifications: 0,
    usersWithoutProfile: 0,
    usersWithInactiveSubscription: 0
  };

  try {
    const job = await Job.findById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (!job.isActive) throw new Error(`Job ${jobId} is not active`);

    stats.jobTitle = job.title;

    logger.info('Starting job alert process', { jobId, jobTitle: job.title, minMatchScore, maxUsers, dryRun, force, isAutomatic });

    // Find matching users using the new engine
    const matchingUsers = await findMatchingUsersForJob(jobId, maxUsers, minMatchScore);
    stats.totalEligibleUsers = matchingUsers.length;

    logger.info('Matching users found', { jobId, count: matchingUsers.length, minMatchScore });

    for (const userMatch of matchingUsers) {
      try {
        // Dedup check — skip if already notified about this job, unless forced
        if (!force) {
          const alreadyNotified = await JobNotification.findOne({
            userId: userMatch.userId,
            jobId,
            emailStatus: 'sent'
          });

          if (alreadyNotified) {
            stats.duplicateNotifications++;
            logger.debug('Duplicate notification skipped', { userId: userMatch.userId, jobId });
            continue;
          }
        }

        if (dryRun) {
          logger.info('[DRY RUN] Would send alert', {
            userId: userMatch.userId,
            email: userMatch.email,
            score: userMatch.matchScore,
            jobTitle: job.title
          });
          stats.emailsSent++;
          continue;
        }

        // Create notification record (pending)
        let notification;
        try {
          notification = await JobNotification.create({
            userId: userMatch.userId,
            jobId,
            emailStatus: 'pending',
            matchScore: userMatch.matchScore,
            matchReasons: userMatch.matchReasons,
            isAutomatic,
            triggeredBy: triggeredBy || null,
            retryCount: 0
          });
        } catch (dupError: any) {
          // Handle race condition on unique index
          if (dupError.code === 11000) {
            stats.duplicateNotifications++;
            continue;
          }
          throw dupError;
        }

        // Send email
        const emailSent = await emailService.sendJobAlertEmail(userMatch.email, {
          userName: userMatch.name,
          jobTitle: job.title,
          companyName: job.company,
          location: job.location,
          jobType: job.type === 'internship' ? 'Internship' : 'Full-time Job',
          description: job.description
            ? job.description.substring(0, 200) + (job.description.length > 200 ? '...' : '')
            : 'Exciting opportunity matching your profile!',
          applicationLink: job.applicationLink || '#',
          matchScore: userMatch.matchScore,
          salary: job.salary,
          stipend: job.stipend,
          applicationDeadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toLocaleDateString('en-IN')
            : 'Open'
        });

        if (emailSent) {
          await JobNotification.findByIdAndUpdate(notification._id, {
            emailStatus: 'sent',
            emailSent: true,
            emailSentAt: new Date()
          });
          stats.emailsSent++;
          logger.info('Job alert sent', { userId: userMatch.userId, email: userMatch.email, jobId, score: userMatch.matchScore });
        } else {
          await JobNotification.findByIdAndUpdate(notification._id, {
            emailStatus: 'failed'
          });
          stats.emailsFailed++;
          logger.error('Job alert email failed', { userId: userMatch.userId, jobId });
        }

      } catch (innerError) {
        stats.emailsFailed++;
        logger.error('Error processing individual user match', {
          error: innerError instanceof Error ? innerError.message : String(innerError),
          userId: userMatch.userId,
          jobId
        });
      }
    }

    logger.info('Job alert process completed', { jobId, stats, dryRun });
    return stats;

  } catch (error) {
    logger.error('Job alert process failed', {
      error: error instanceof Error ? error.message : String(error),
      jobId
    });
    throw error;
  }
};

// ─── Bulk Alert — All Active Jobs ────────────────────────────────────────────

/**
 * Send job alerts for ALL active jobs that have not yet expired.
 * Aggregates matches so each user receives only ONE email with all matching jobs.
 */
export const sendJobAlertsForAllActiveJobs = async (options: {
  minMatchScore?: number;
  maxUsersPerJob?: number;
  dryRun?: boolean;
  force?: boolean;
  isAutomatic?: boolean;
  triggeredBy?: string;
} = {}): Promise<BulkAlertResult> => {
  const { minMatchScore = 50, maxUsersPerJob = 100, dryRun = false, force = false, isAutomatic = true, triggeredBy } = options;

  const result: BulkAlertResult = {
    totalJobs: 0,
    totalEligibleUsers: 0,
    totalEmailsSent: 0,
    totalEmailsFailed: 0,
    totalDuplicates: 0,
    perJob: {}
  };

  try {
    // 1. Get all active jobs
    const activeJobs = await Job.find({
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    result.totalJobs = activeJobs.length;
    logger.info('Starting aggregated bulk job alerts', { totalJobs: activeJobs.length, minMatchScore, dryRun, force });

    // 2. Match Aggregator: Map<UserEmail, UserAggregationData>
    const userAggregator = new Map<string, { 
      userId: string, 
      name: string, 
      email: string, 
      matches: Array<{ job: any, score: number, reasons: string[] }> 
    }>();

    // 3. Process each job to find matches
    for (const job of activeJobs) {
      const jobIdStr = (job._id as any).toString();
      
      // Initialize per-job stats
      result.perJob[jobIdStr] = {
        jobId: jobIdStr,
        jobTitle: job.title,
        totalEligibleUsers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        duplicateNotifications: 0,
        usersWithoutProfile: 0,
        usersWithInactiveSubscription: 0
      };

      try {
        const matchingUsers = await findMatchingUsersForJob(jobIdStr, maxUsersPerJob, minMatchScore);
        result.perJob[jobIdStr].totalEligibleUsers = matchingUsers.length;
        result.totalEligibleUsers += matchingUsers.length;

        for (const userMatch of matchingUsers) {
          // Dedup check — skip if already notified about this job, unless forced
          if (!force) {
            const alreadyNotified = await JobNotification.findOne({
              userId: userMatch.userId,
              jobId: job._id,
              emailStatus: 'sent'
            });

            if (alreadyNotified) {
              result.perJob[jobIdStr].duplicateNotifications++;
              result.totalDuplicates++;
              continue;
            }
          }

          // Add to user aggregator
          if (!userAggregator.has(userMatch.email)) {
            userAggregator.set(userMatch.email, {
              userId: userMatch.userId,
              name: userMatch.name,
              email: userMatch.email,
              matches: []
            });
          }
          
          userAggregator.get(userMatch.email)!.matches.push({
            job: job,
            score: userMatch.matchScore,
            reasons: userMatch.matchReasons
          });
        }
      } catch (jobError) {
        logger.error(`Error matching for job ${job.title}`, { error: jobError instanceof Error ? jobError.message : String(jobError) });
      }
    }

    // 4. Send aggregated emails to each user
    const frontendUrl = process.env.FRONTEND_URL || 'https://careerx.co';
    
    for (const [email, data] of userAggregator.entries()) {
      try {
        const jobCount = data.matches.length;
        if (jobCount === 0) continue;

        // Create notification records in DB (one for each job)
        const notificationIds: any[] = [];
        for (const match of data.matches) {
          try {
            const notification = await JobNotification.create({
              userId: data.userId,
              jobId: match.job._id,
              emailStatus: 'pending',
              matchScore: match.score,
              matchReasons: match.reasons,
              isAutomatic,
              triggeredBy: triggeredBy || null
            });
            notificationIds.push(notification._id);
          } catch (createErr) {
            // Likely duplicate if unique index was somehow still there
            logger.warn('Failed to create notification record during aggregation', { userId: data.userId, jobId: match.job._id });
          }
        }

        if (dryRun) {
          result.totalEmailsSent++;
          for (const match of data.matches) {
            result.perJob[match.job._id.toString()].emailsSent++;
          }
          continue;
        }

        // Send aggregated email
        const emailSent = await emailService.sendAggregatedJobAlertEmail(email, {
          name: data.name,
          jobCount: jobCount,
          jobs: data.matches.map(m => ({
            title: m.job.title,
            company: m.job.company,
            location: m.job.location,
            type: m.job.type === 'internship' ? 'Internship' : 'Full-time Job',
            matchPercentage: m.score,
            description: m.job.description ? m.job.description.substring(0, 150) + (m.job.description.length > 150 ? '...' : '') : 'Exciting opportunity!',
            applicationLink: m.job.applicationLink || `${frontendUrl}/jobs/${m.job._id}`,
            salary: m.job.salary || m.job.stipend
          })),
          dashboardUrl: `${frontendUrl}/dashboard`
        });

        if (emailSent) {
          await JobNotification.updateMany({ _id: { $in: notificationIds } }, {
            emailStatus: 'sent',
            emailSent: true,
            emailSentAt: new Date()
          });
          
          result.totalEmailsSent++;
          for (const match of data.matches) {
            result.perJob[match.job._id.toString()].emailsSent++;
          }
          logger.info(`Aggregated job alert sent to ${email}`, { jobCount });
        } else {
          await JobNotification.updateMany({ _id: { $in: notificationIds } }, {
            emailStatus: 'failed'
          });
          
          result.totalEmailsFailed++;
          for (const match of data.matches) {
            result.perJob[match.job._id.toString()].emailsFailed++;
          }
        }
      } catch (userError) {
        logger.error(`Critical error processing user ${email}`, { error: userError instanceof Error ? userError.message : String(userError) });
        result.totalEmailsFailed++;
      }
    }

    logger.info('Aggregated bulk alert process completed', {
      totalUsersMatched: userAggregator.size,
      totalEmailsSent: result.totalEmailsSent,
      dryRun
    });

    return result;
  } catch (error) {
    logger.error('Bulk aggregated job alerts failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// ─── Retry Failed Notifications ───────────────────────────────────────────────

const MAX_RETRIES = 3;

/**
 * Retry all failed job notifications that haven't exceeded MAX_RETRIES.
 */
export const retryFailedJobNotifications = async (jobId?: string): Promise<{
  retried: number;
  successful: number;
  failed: number;
  skippedMaxRetries: number;
}> => {
  const result = { retried: 0, successful: 0, failed: 0, skippedMaxRetries: 0 };

  try {
    const query: any = {
      emailStatus: 'failed',
      retryCount: { $lt: MAX_RETRIES }
    };
    if (jobId) query.jobId = jobId;

    const failedNotifications = await JobNotification.find(query)
      .populate('userId', 'name email')
      .populate('jobId', 'title company location type description applicationLink');

    logger.info('Retrying failed notifications', { total: failedNotifications.length, jobId });

    for (const notification of failedNotifications) {
      try {
        result.retried++;

        const user = notification.userId as any;
        const job = notification.jobId as any;

        if (!user || !job) {
          result.failed++;
          continue;
        }

        const emailSent = await emailService.sendJobAlertEmail(user.email, {
          userName: user.name,
          jobTitle: job.title,
          companyName: job.company,
          location: job.location,
          jobType: job.type === 'internship' ? 'Internship' : 'Full-time Job',
          description: job.description?.substring(0, 200) || 'Exciting opportunity!',
          applicationLink: job.applicationLink || '#',
          matchScore: notification.matchScore || 0,
          applicationDeadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toLocaleDateString('en-IN')
            : 'Open'
        });

        if (emailSent) {
          await JobNotification.findByIdAndUpdate(notification._id, {
            emailStatus: 'sent',
            emailSent: true,
            emailSentAt: new Date(),
            $inc: { retryCount: 1 },
            lastRetryAt: new Date()
          });
          result.successful++;
          logger.info('Retry successful', { notificationId: notification._id, email: user.email });
        } else {
          await JobNotification.findByIdAndUpdate(notification._id, {
            $inc: { retryCount: 1 },
            lastRetryAt: new Date()
          });
          result.failed++;
        }

      } catch (retryError) {
        result.failed++;
        logger.error('Error retrying notification', {
          error: retryError instanceof Error ? retryError.message : String(retryError),
          notificationId: notification._id
        });
      }
    }

    logger.info('Retry process completed', result);
    return result;
  } catch (error) {
    logger.error('retryFailedJobNotifications failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// ─── Statistics ───────────────────────────────────────────────────────────────

export const getJobAlertStats = async (jobId?: string) => {
  const query: any = jobId ? { jobId } : {};
  const notifications = await JobNotification.find(query);

  const total = notifications.length;
  const sent = notifications.filter(n => n.emailStatus === 'sent').length;
  const failed = notifications.filter(n => n.emailStatus === 'failed').length;
  const pending = notifications.filter(n => n.emailStatus === 'pending').length;
  const automatic = notifications.filter(n => n.isAutomatic).length;
  const manual = notifications.filter(n => !n.isAutomatic).length;

  const withScore = notifications.filter(n => n.matchScore > 0);
  const avgScore = withScore.length > 0
    ? Math.round(withScore.reduce((sum, n) => sum + n.matchScore, 0) / withScore.length)
    : 0;

  return {
    totalNotifications: total,
    sentNotifications: sent,
    failedNotifications: failed,
    pendingNotifications: pending,
    automaticNotifications: automatic,
    manualNotifications: manual,
    averageMatchScore: avgScore
  };
};
