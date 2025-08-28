export interface SubscriptionStatus {
    isActive: boolean;
    daysRemaining: number;
    status: string;
    plan: string;
    endDate: Date;
}
export interface RenewalOptions {
    userId: string;
    plan: string;
    amount: number;
    autoRenew?: boolean;
}
export interface ExpiryNotification {
    userId: string;
    subscriptionId: string;
    plan: string;
    daysUntilExpiry: number;
    email: string;
    name: string;
}
/**
 * Check if a user has an active subscription
 */
export declare const checkSubscriptionStatus: (userId: string) => Promise<SubscriptionStatus | null>;
/**
 * Get subscription features based on plan
 */
export declare const getSubscriptionFeatures: (plan: string) => string[];
/**
 * Get maximum jobs allowed for a subscription plan
 */
export declare const getMaxJobsForPlan: (plan: string) => number;
/**
 * Check if user can access premium features
 */
export declare const canAccessPremiumFeatures: (userId: string) => Promise<boolean>;
/**
 * Check if user can access enterprise features
 */
export declare const canAccessEnterpriseFeatures: (userId: string) => Promise<boolean>;
/**
 * Process subscription renewal
 */
export declare const processSubscriptionRenewal: (options: RenewalOptions) => Promise<boolean>;
/**
 * Get subscriptions expiring soon (within specified days)
 */
export declare const getSubscriptionsExpiringSoon: (daysThreshold?: number) => Promise<ExpiryNotification[]>;
/**
 * Get expired subscriptions that need status update
 */
export declare const getExpiredSubscriptions: () => Promise<string[]>;
/**
 * Update subscription status to expired
 */
export declare const markSubscriptionAsExpired: (subscriptionId: string) => Promise<boolean>;
/**
 * Get subscription statistics for dashboard
 */
export declare const getSubscriptionStats: () => Promise<{
    overview: {
        totalSubscriptions: number;
        activeSubscriptions: number;
        expiredSubscriptions: number;
        pendingSubscriptions: number;
    };
    planDistribution: any[];
    monthlyTrends: any[];
    revenue: {
        total: any;
        average: number;
    };
}>;
/**
 * Validate subscription plan upgrade/downgrade
 */
export declare const validatePlanChange: (currentPlan: string, newPlan: string) => boolean;
/**
 * Calculate prorated amount for plan changes
 */
export declare const calculateProratedAmount: (currentPlan: string, newPlan: string, daysRemaining: number, currentAmount: number) => number;
//# sourceMappingURL=subscriptionService.d.ts.map