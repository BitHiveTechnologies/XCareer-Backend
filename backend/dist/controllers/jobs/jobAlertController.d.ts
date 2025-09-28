import { Request, Response } from 'express';
/**
 * Send job alerts for a specific job
 */
export declare const sendJobAlerts: (req: Request, res: Response) => Promise<void>;
/**
 * Send job alerts for all active jobs
 */
export declare const sendAllJobAlerts: (req: Request, res: Response) => Promise<void>;
/**
 * Get job alert statistics
 */
export declare const getJobAlertStatistics: (req: Request, res: Response) => Promise<void>;
/**
 * Retry failed job notifications
 */
export declare const retryFailedNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * Get scheduler status
 */
export declare const getSchedulerStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Manually trigger scheduler tasks
 */
export declare const triggerSchedulerTask: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=jobAlertController.d.ts.map