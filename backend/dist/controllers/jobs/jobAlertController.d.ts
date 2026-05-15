import { Request, Response } from 'express';
/**
 * Send job alerts for a specific job (Admin only)
 * POST /api/v1/jobs/alerts/send/:jobId
 */
export declare const sendJobAlerts: (req: Request, res: Response) => Promise<void>;
/**
 * Send job alerts for ALL active jobs (Admin only)
 * POST /api/v1/jobs/alerts/send-all
 */
export declare const sendAllJobAlerts: (req: Request, res: Response) => Promise<void>;
/**
 * Get job alert statistics (Admin only)
 * GET /api/v1/jobs/alerts/statistics
 */
export declare const getJobAlertStatistics: (req: Request, res: Response) => Promise<void>;
/**
 * Retry failed notifications (Admin only)
 * POST /api/v1/jobs/alerts/retry-failed
 */
export declare const retryFailedNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * Get scheduler status (Admin only)
 * GET /api/v1/jobs/alerts/scheduler/status
 */
export declare const getSchedulerStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Manually trigger scheduler tasks (Admin only)
 * POST /api/v1/jobs/alerts/scheduler/trigger
 */
export declare const triggerSchedulerTask: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=jobAlertController.d.ts.map