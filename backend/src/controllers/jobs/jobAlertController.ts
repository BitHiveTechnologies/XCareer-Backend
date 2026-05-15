import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import {
  sendJobAlertsForJob,
  sendJobAlertsForAllActiveJobs,
  retryFailedJobNotifications,
  getJobAlertStats
} from '../../services/jobAlertService';
import { schedulerService } from '../../services/schedulerService';

/**
 * Send job alerts for a specific job (Admin only)
 * POST /api/v1/jobs/alerts/send/:jobId
 */
export const sendJobAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { minMatchScore = 50, maxUsers = 100, dryRun = false, force = false } = req.body;
    const adminId = req.user?.id;

    logger.info('Admin triggered job alert for single job', { adminId, jobId, minMatchScore, dryRun, ip: req.ip });

    const stats = await sendJobAlertsForJob({
      jobId,
      minMatchScore: Number(minMatchScore),
      maxUsers: Number(maxUsers),
      dryRun: Boolean(dryRun),
      force: Boolean(force),
      isAutomatic: false,
      triggeredBy: adminId
    });

    res.status(200).json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Job alerts sent successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('sendJobAlerts failed', {
      error: error instanceof Error ? error.message : String(error),
      jobId: req.params.jobId,
      adminId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to send job alerts' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send job alerts for ALL active jobs (Admin only)
 * POST /api/v1/jobs/alerts/send-all
 */
export const sendAllJobAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { minMatchScore = 50, maxUsersPerJob = 100, dryRun = false, force = false } = req.body;
    const adminId = req.user?.id;

    logger.info('Admin triggered bulk job alerts for all jobs', { adminId, minMatchScore, dryRun, ip: req.ip });

    const result = await sendJobAlertsForAllActiveJobs({
      minMatchScore: Number(minMatchScore),
      maxUsersPerJob: Number(maxUsersPerJob),
      dryRun: Boolean(dryRun),
      force: Boolean(force),
      isAutomatic: false,
      triggeredBy: adminId
    });

    res.status(200).json({
      success: true,
      message: dryRun ? 'All job alerts dry run completed' : 'All job alerts sent successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('sendAllJobAlerts failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to send all job alerts' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job alert statistics (Admin only)
 * GET /api/v1/jobs/alerts/statistics
 */
export const getJobAlertStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.query;
    const stats = await getJobAlertStats(jobId as string | undefined);

    res.status(200).json({
      success: true,
      data: { statistics: stats, jobId: jobId || 'all' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('getJobAlertStatistics failed', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get statistics' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retry failed notifications (Admin only)
 * POST /api/v1/jobs/alerts/retry-failed
 */
export const retryFailedNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    const result = await retryFailedJobNotifications(jobId);

    res.status(200).json({
      success: true,
      message: 'Retry completed',
      data: { result, jobId: jobId || 'all' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('retryFailedNotifications failed', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retry notifications' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get scheduler status (Admin only)
 * GET /api/v1/jobs/alerts/scheduler/status
 */
export const getSchedulerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = schedulerService.getStatus();
    res.status(200).json({
      success: true,
      data: { status },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get scheduler status' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Manually trigger scheduler tasks (Admin only)
 * POST /api/v1/jobs/alerts/scheduler/trigger
 */
export const triggerSchedulerTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task, dryRun = false } = req.body;

    if (!task || !['jobAlerts', 'retryFailed'].includes(task)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid task. Must be "jobAlerts" or "retryFailed"' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    let result;
    if (task === 'jobAlerts') {
      result = await schedulerService.triggerJobAlerts(dryRun);
    } else {
      result = await schedulerService.triggerRetryFailed();
    }

    res.status(200).json({
      success: true,
      message: `Task "${task}" completed`,
      data: { task, result, dryRun },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to trigger scheduler task' },
      timestamp: new Date().toISOString()
    });
  }
};
