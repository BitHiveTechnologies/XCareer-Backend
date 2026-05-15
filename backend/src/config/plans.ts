export interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  duration: number; // in days
  features: string[];
  maxJobs: number;
  priority: 'low' | 'medium' | 'high';
  // Feature flags for gating
  resumeTemplates: ('basic' | 'premium')[];
  notificationPriority: ('standard' | 'priority' | 'support')[];
  jobNotifications: boolean;
  prioritySupport: boolean;
}

export const PLANS: Record<string, Plan> = {
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
export const getPlanById = (id: string): Plan | undefined => {
  const normalized = id.toLowerCase();
  // Accept 'pro' as alias for 'enterprise' (UI → DB mapping)
  const key = normalized === 'pro' ? 'enterprise' : normalized;
  return PLANS[key];
};

export const getAllPlans = (): Plan[] => {
  return Object.values(PLANS);
};

/**
 * Returns the tier level for a plan (used for template access gating).
 * enterprise/pro = 3, premium = 2, basic = 1
 */
export const getPlanTierLevel = (planId: string): number => {
  const normalized = planId?.toLowerCase() === 'pro' ? 'enterprise' : planId?.toLowerCase();
  const hierarchy: Record<string, number> = { basic: 1, premium: 2, enterprise: 3 };
  return hierarchy[normalized] || 0;
};

/**
 * Check if a given plan has access to a specific resume template tier.
 * Template tiers: 'basic' (free to all), 'premium' (premium+enterprise plans only)
 */
export const planHasTemplateAccess = (planId: string, templateTier: 'basic' | 'premium'): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return templateTier === 'basic'; // Default: only basic access
  return plan.resumeTemplates.includes(templateTier);
};

/**
 * Check if a plan receives priority/support notifications.
 */
export const planHasPriorityNotifications = (planId: string): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.notificationPriority.includes('priority') || plan.notificationPriority.includes('support');
};
