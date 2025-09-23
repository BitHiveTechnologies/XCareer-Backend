import { Request, Response } from 'express';
/**
 * Get user's current subscription
 */
export declare const getCurrentSubscription: (req: Request, res: Response) => Promise<void>;
/**
 * Get all available subscription plans
 */
export declare const getAvailablePlans: (_req: Request, res: Response) => Promise<void>;
/**
 * Get subscription history for a user
 */
export declare const getSubscriptionHistory: (req: Request, res: Response) => Promise<void>;
/**
 * Cancel subscription
 */
export declare const cancelSubscription: (req: Request, res: Response) => Promise<void>;
/**
 * Renew subscription
 */
export declare const renewSubscription: (req: Request, res: Response) => Promise<void>;
/**
 * Get subscription analytics (admin only)
 */
export declare const getSubscriptionAnalytics: (req: Request, res: Response) => Promise<void>;
/**
 * Process subscription expiry (cron job endpoint)
 */
export declare const processSubscriptionExpiry: (_req: Request, res: Response) => Promise<void>;
/**
 * Update subscription plan (Admin only)
 */
export declare const updateSubscriptionPlan: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=subscriptionController.d.ts.map