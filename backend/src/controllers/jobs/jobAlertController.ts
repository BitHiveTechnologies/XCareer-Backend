import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { sendJobAlertsForJob, sendJobAlertsForAllActiveJobs, getJobAlertStats, retryFailedJobNotifications } from '../../services/jobAlertService';
import { schedulerService } from '../../services/schedulerService';

/**
 * Send job alerts for a specific job
 */
export const sendJobAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.params;
    const {
      minMatchScore = 40,
      maxUsers = 100,
      dryRun = false
    } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job ID is required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('Manual job alerts triggered', {
      adminId,
      jobId,
      minMatchScore,
      maxUsers,
      dryRun,
      ip: req.ip
    });

    const stats = await sendJobAlertsForJob({
      jobId,
      minMatchScore,
      maxUsers,
      dryRun
    });

    res.status(200).json({
      success: true,
      message: dryRun ? 'Job alerts dry run completed' : 'Job alerts sent successfully',
      data: {
        jobId,
        stats,
        dryRun
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Send job alerts failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      jobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send job alerts'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send job alerts for all active jobs
 */
export const sendAllJobAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const {
      minMatchScore = 40,
      maxUsersPerJob = 100,
      dryRun = false
    } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('Manual all job alerts triggered', {
      adminId,
      minMatchScore,
      maxUsersPerJob,
      dryRun,
      ip: req.ip
    });

    const results = await sendJobAlertsForAllActiveJobs({
      minMatchScore,
      maxUsersPerJob,
      dryRun
    });

    // Calculate total stats
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

    res.status(200).json({
      success: true,
      message: dryRun ? 'All job alerts dry run completed' : 'All job alerts sent successfully',
      data: {
        totalJobs: Object.keys(results).length,
        totalStats,
        results,
        dryRun
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Send all job alerts failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send all job alerts'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job alert statistics
 */
export const getJobAlertStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.query;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const stats = await getJobAlertStats(jobId as string);

    logger.info('Job alert statistics retrieved', {
      adminId,
      jobId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        jobId: jobId || 'all'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job alert statistics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job alert statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retry failed job notifications
 */
export const retryFailedNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('Manual retry failed notifications triggered', {
      adminId,
      jobId,
      ip: req.ip
    });

    const result = await retryFailedJobNotifications(jobId);

    res.status(200).json({
      success: true,
      message: 'Failed notifications retry completed',
      data: {
        result,
        jobId: jobId || 'all'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Retry failed notifications failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retry failed notifications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get scheduler status
 */
export const getSchedulerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const status = schedulerService.getStatus();

    logger.info('Scheduler status retrieved', {
      adminId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get scheduler status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get scheduler status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Manually trigger scheduler tasks
 */
export const triggerSchedulerTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { task, dryRun = false } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!task || !['jobAlerts', 'retryFailed'].includes(task)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task. Must be "jobAlerts" or "retryFailed"'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('Manual scheduler task triggered', {
      adminId,
      task,
      dryRun,
      ip: req.ip
    });

    let result;
    if (task === 'jobAlerts') {
      result = await schedulerService.triggerJobAlerts(dryRun);
    } else if (task === 'retryFailed') {
      result = await schedulerService.triggerRetryFailed();
    }

    res.status(200).json({
      success: true,
      message: `Scheduler task "${task}" completed successfully`,
      data: {
        task,
        result,
        dryRun
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Trigger scheduler task failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      task: req.body.task,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to trigger scheduler task'
      },
      timestamp: new Date().toISOString()
    });
  }
};
