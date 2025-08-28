import { Request, Response } from 'express';
interface AdminRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId: string;
        metadata?: Record<string, any>;
    };
}
/**
 * Get comprehensive dashboard statistics
 */
export declare const getDashboardStats: (req: AdminRequest, res: Response) => Promise<void>;
/**
 * Get comprehensive user analytics
 */
export declare const getUserAnalytics: (req: AdminRequest, res: Response) => Promise<void>;
/**
 * Get comprehensive job analytics
 */
export declare const getJobAnalytics: (req: AdminRequest, res: Response) => Promise<void>;
/**
 * Get system health and performance metrics
 */
export declare const getSystemHealth: (req: AdminRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=adminController.d.ts.map