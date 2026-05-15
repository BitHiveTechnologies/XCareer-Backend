import { Request, Response } from 'express';
import { AdminRequest } from '../../types/express';
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
/**
 * Trigger job matching and notifications for a specific job
 */
export declare const notifyUsersForJob: (req: Request, res: Response) => Promise<void>;
/**
 * Get all users with filtering and pagination (Admin only)
 */
export declare const getAllUsers: (req: AdminRequest, res: Response) => Promise<void>;
/**
 * Get all payment history (admin only)
 */
export declare const getAllPayments: (req: Request, res: Response) => Promise<void>;
/**
 * Get all customers (admin only)
 */
export declare const getAllCustomers: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map