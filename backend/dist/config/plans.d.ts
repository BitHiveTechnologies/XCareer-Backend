export interface Plan {
    id: string;
    name: string;
    displayName: string;
    price: number;
    duration: number;
    features: string[];
    maxJobs: number;
    priority: 'low' | 'medium' | 'high';
    resumeTemplates: ('basic' | 'premium')[];
    notificationPriority: ('standard' | 'priority' | 'support')[];
    jobNotifications: boolean;
    prioritySupport: boolean;
}
export declare const PLANS: Record<string, Plan>;
/**
 * Get plan by ID. Accepts 'pro' as an alias for 'enterprise'.
 */
export declare const getPlanById: (id: string) => Plan | undefined;
export declare const getAllPlans: () => Plan[];
/**
 * Returns the tier level for a plan (used for template access gating).
 * enterprise/pro = 3, premium = 2, basic = 1
 */
export declare const getPlanTierLevel: (planId: string) => number;
/**
 * Check if a given plan has access to a specific resume template tier.
 * Template tiers: 'basic' (free to all), 'premium' (premium+enterprise plans only)
 */
export declare const planHasTemplateAccess: (planId: string, templateTier: "basic" | "premium") => boolean;
/**
 * Check if a plan receives priority/support notifications.
 */
export declare const planHasPriorityNotifications: (planId: string) => boolean;
//# sourceMappingURL=plans.d.ts.map