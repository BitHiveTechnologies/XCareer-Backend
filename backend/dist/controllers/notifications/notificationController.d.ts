import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: Record<string, any>;
    };
}
/**
 * Get user notifications with filtering and pagination
 */
export declare const getUserNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Mark notification as read
 */
export declare const markNotificationAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Mark all notifications as read for user
 */
export declare const markAllNotificationsAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete notification
 */
export declare const deleteNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get notification statistics for user
 */
export declare const getNotificationStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create notification (admin only)
 */
export declare const createNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Bulk create notifications (admin only)
 */
export declare const bulkCreateNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=notificationController.d.ts.map