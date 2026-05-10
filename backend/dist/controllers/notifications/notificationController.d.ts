import { Request, Response } from 'express';
/**
 * Get user notifications with filtering and pagination
 */
export declare const getUserNotifications: (req: Request, res: Response) => Promise<void>;
/**
 * Mark notification as read
 */
export declare const markNotificationAsRead: (req: Request, res: Response) => Promise<void>;
/**
 * Mark all notifications as read for user
 */
export declare const markAllNotificationsAsRead: (req: Request, res: Response) => Promise<void>;
/**
 * Delete notification
 */
export declare const deleteNotification: (req: Request, res: Response) => Promise<void>;
/**
 * Get notification statistics for user
 */
export declare const getNotificationStats: (req: Request, res: Response) => Promise<void>;
/**
 * Create notification (admin only)
 */
export declare const createNotification: (req: Request, res: Response) => Promise<void>;
/**
 * Bulk create notifications (admin only)
 */
export declare const bulkCreateNotifications: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map