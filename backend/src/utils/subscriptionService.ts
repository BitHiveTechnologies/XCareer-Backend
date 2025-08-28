import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { logger } from './logger';
import { SUBSCRIPTION_PLANS, calculateSubscriptionEndDate } from './paymentService';

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
export const checkSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      status: 'completed',
      endDate: { $gt: new Date() }
    }).sort({ endDate: -1 });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isActive: daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
      status: subscription.status,
      plan: subscription.plan,
      endDate: subscription.endDate
    };
  } catch (error) {
    logger.error('Check subscription status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return null;
  }
};

/**
 * Get subscription features based on plan
 */
export const getSubscriptionFeatures = (plan: string): string[] => {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  return planDetails ? planDetails.features : [];
};

/**
 * Get maximum jobs allowed for a subscription plan
 */
export const getMaxJobsForPlan = (plan: string): number => {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  return planDetails ? planDetails.maxJobs : 0;
};

/**
 * Check if user can access premium features
 */
export const canAccessPremiumFeatures = async (userId: string): Promise<boolean> => {
  try {
    const subscriptionStatus = await checkSubscriptionStatus(userId);
    if (!subscriptionStatus || !subscriptionStatus.isActive) {
      return false;
    }

    const plan = subscriptionStatus.plan;
    return plan === 'premium' || plan === 'enterprise';
  } catch (error) {
    logger.error('Check premium features access failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return false;
  }
};

/**
 * Check if user can access enterprise features
 */
export const canAccessEnterpriseFeatures = async (userId: string): Promise<boolean> => {
  try {
    const subscriptionStatus = await checkSubscriptionStatus(userId);
    if (!subscriptionStatus || !subscriptionStatus.isActive) {
      return false;
    }

    return subscriptionStatus.plan === 'enterprise';
  } catch (error) {
    logger.error('Check enterprise features access failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return false;
  }
};

/**
 * Process subscription renewal
 */
export const processSubscriptionRenewal = async (options: RenewalOptions): Promise<boolean> => {
  try {
    const { userId, plan, amount, autoRenew = false } = options;

    // Check if plan is valid
    if (!SUBSCRIPTION_PLANS[plan]) {
      throw new Error(`Invalid subscription plan: ${plan}`);
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = calculateSubscriptionEndDate(plan, startDate);

    // Create renewal subscription
    const renewalSubscription = new Subscription({
      userId,
      plan,
      amount,
      status: 'pending',
      startDate,
      endDate,
      paymentId: 'pending',
      orderId: 'pending'
    });

    await renewalSubscription.save();

    logger.info('Subscription renewal processed', {
      userId,
      plan,
      amount,
      subscriptionId: renewalSubscription._id,
      autoRenew
    });

    return true;
  } catch (error) {
    logger.error('Process subscription renewal failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: options.userId,
      plan: options.plan
    });
    return false;
  }
};

/**
 * Get subscriptions expiring soon (within specified days)
 */
export const getSubscriptionsExpiringSoon = async (daysThreshold: number = 7): Promise<ExpiryNotification[]> => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const expiringSubscriptions = await Subscription.find({
      status: 'completed',
      endDate: { $lte: thresholdDate, $gt: new Date() }
    }).populate('userId', 'email name');

    const notifications: ExpiryNotification[] = [];

    for (const subscription of expiringSubscriptions) {
      const daysUntilExpiry = Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0) {
        notifications.push({
          userId: subscription.userId.toString(),
          subscriptionId: subscription._id.toString(),
          plan: subscription.plan,
          daysUntilExpiry,
          email: (subscription.userId as any).email,
          name: (subscription.userId as any).name
        });
      }
    }

    return notifications;
  } catch (error) {
    logger.error('Get subscriptions expiring soon failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      daysThreshold
    });
    return [];
  }
};

/**
 * Get expired subscriptions that need status update
 */
export const getExpiredSubscriptions = async (): Promise<string[]> => {
  try {
    const expiredSubscriptions = await Subscription.find({
      status: 'completed',
      endDate: { $lte: new Date() }
    }).select('_id');

    return expiredSubscriptions.map(sub => sub._id.toString());
  } catch (error) {
    logger.error('Get expired subscriptions failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
};

/**
 * Update subscription status to expired
 */
export const markSubscriptionAsExpired = async (subscriptionId: string): Promise<boolean> => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return false;
    }

    subscription.status = 'expired';
    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(subscription.userId, {
      subscriptionStatus: 'expired'
    });

    logger.info('Subscription marked as expired', {
      subscriptionId,
      userId: subscription.userId
    });

    return true;
  } catch (error) {
    logger.error('Mark subscription as expired failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      subscriptionId
    });
    return false;
  }
};

/**
 * Get subscription statistics for dashboard
 */
export const getSubscriptionStats = async () => {
  try {
    const now = new Date();

    // Basic counts
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: 'completed',
      endDate: { $gt: now }
    });
    const expiredSubscriptions = await Subscription.countDocuments({
      status: 'completed',
      endDate: { $lte: now }
    });
    const pendingSubscriptions = await Subscription.countDocuments({
      status: 'pending'
    });

    // Plan distribution
    const planDistribution = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Revenue metrics
    const totalRevenue = planDistribution.reduce((sum, plan) => sum + plan.totalAmount, 0);
    const averageRevenue = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;

    return {
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        pendingSubscriptions
      },
      planDistribution,
      monthlyTrends,
      revenue: {
        total: totalRevenue,
        average: Math.round(averageRevenue * 100) / 100
      }
    };
  } catch (error) {
    logger.error('Get subscription stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

/**
 * Validate subscription plan upgrade/downgrade
 */
export const validatePlanChange = (currentPlan: string, newPlan: string): boolean => {
  const plans = Object.keys(SUBSCRIPTION_PLANS);
  const currentIndex = plans.indexOf(currentPlan);
  const newIndex = plans.indexOf(newPlan);

  if (currentIndex === -1 || newIndex === -1) {
    return false;
  }

  // Allow any plan change (upgrade or downgrade)
  return true;
};

/**
 * Calculate prorated amount for plan changes
 */
export const calculateProratedAmount = (
  currentPlan: string,
  newPlan: string,
  daysRemaining: number,
  currentAmount: number
): number => {
  try {
    const currentPlanDetails = SUBSCRIPTION_PLANS[currentPlan];
    const newPlanDetails = SUBSCRIPTION_PLANS[newPlan];

    if (!currentPlanDetails || !newPlanDetails) {
      return newPlanDetails?.price || 0;
    }

    // Calculate daily rate for current plan
    const currentDailyRate = currentAmount / currentPlanDetails.duration;
    
    // Calculate refund for remaining days
    const refundAmount = currentDailyRate * daysRemaining;
    
    // Calculate new plan cost
    const newPlanCost = newPlanDetails.price;
    
    // Final amount = new plan cost - refund
    const finalAmount = Math.max(0, newPlanCost - refundAmount);
    
    return Math.round(finalAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    logger.error('Calculate prorated amount failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      currentPlan,
      newPlan,
      daysRemaining
    });
    return SUBSCRIPTION_PLANS[newPlan]?.price || 0;
  }
};
