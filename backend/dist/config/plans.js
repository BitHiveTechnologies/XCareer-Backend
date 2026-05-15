"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planHasPriorityNotifications = exports.planHasTemplateAccess = exports.getPlanTierLevel = exports.getAllPlans = exports.getPlanById = exports.PLANS = void 0;
exports.PLANS = {
    basic: {
        id: 'basic',
        name: 'Basic Plan',
        displayName: 'Basic',
        price: 49,
        duration: 30,
        features: [
            'Job notifications (email alerts)',
            'Basic resume template (Vinod)',
            'Access to standard job listings',
            'Basic profile management',
            'Up to 50 job applications/month'
        ],
        maxJobs: 50,
        priority: 'low',
        resumeTemplates: ['basic'],
        notificationPriority: ['standard'],
        jobNotifications: true,
        prioritySupport: false
    },
    premium: {
        id: 'premium',
        name: 'Premium Plan',
        displayName: 'Premium',
        price: 99,
        duration: 30,
        features: [
            'All Basic plan features',
            'Job notifications (email alerts)',
            'Premium resume templates (Standard Professional, Creative Executive)',
            'Priority job matching algorithm',
            'Advanced application analytics',
            'Up to 200 job applications/month'
        ],
        maxJobs: 200,
        priority: 'medium',
        resumeTemplates: ['basic', 'premium'],
        notificationPriority: ['standard'],
        jobNotifications: true,
        prioritySupport: false
    },
    // Stored as 'enterprise' in DB for backward-compatibility,
    // displayed as 'Pro' to users everywhere in the UI
    enterprise: {
        id: 'enterprise',
        name: 'Pro Plan',
        displayName: 'Pro',
        price: 299,
        duration: 30,
        features: [
            'All Premium plan features',
            'Priority & support notifications',
            'All premium resume templates',
            'Dedicated priority support',
            'Advanced reporting & analytics',
            'Unlimited job applications',
            'Up to 1000 job applications/month'
        ],
        maxJobs: 1000,
        priority: 'high',
        resumeTemplates: ['basic', 'premium'],
        notificationPriority: ['standard', 'priority', 'support'],
        jobNotifications: true,
        prioritySupport: true
    }
};
/**
 * Get plan by ID. Accepts 'pro' as an alias for 'enterprise'.
 */
const getPlanById = (id) => {
    const normalized = id.toLowerCase();
    // Accept 'pro' as alias for 'enterprise' (UI → DB mapping)
    const key = normalized === 'pro' ? 'enterprise' : normalized;
    return exports.PLANS[key];
};
exports.getPlanById = getPlanById;
const getAllPlans = () => {
    return Object.values(exports.PLANS);
};
exports.getAllPlans = getAllPlans;
/**
 * Returns the tier level for a plan (used for template access gating).
 * enterprise/pro = 3, premium = 2, basic = 1
 */
const getPlanTierLevel = (planId) => {
    const normalized = planId?.toLowerCase() === 'pro' ? 'enterprise' : planId?.toLowerCase();
    const hierarchy = { basic: 1, premium: 2, enterprise: 3 };
    return hierarchy[normalized] || 0;
};
exports.getPlanTierLevel = getPlanTierLevel;
/**
 * Check if a given plan has access to a specific resume template tier.
 * Template tiers: 'basic' (free to all), 'premium' (premium+enterprise plans only)
 */
const planHasTemplateAccess = (planId, templateTier) => {
    const plan = (0, exports.getPlanById)(planId);
    if (!plan)
        return templateTier === 'basic'; // Default: only basic access
    return plan.resumeTemplates.includes(templateTier);
};
exports.planHasTemplateAccess = planHasTemplateAccess;
/**
 * Check if a plan receives priority/support notifications.
 */
const planHasPriorityNotifications = (planId) => {
    const plan = (0, exports.getPlanById)(planId);
    if (!plan)
        return false;
    return plan.notificationPriority.includes('priority') || plan.notificationPriority.includes('support');
};
exports.planHasPriorityNotifications = planHasPriorityNotifications;
//# sourceMappingURL=plans.js.map