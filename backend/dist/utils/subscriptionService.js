"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProratedAmount = exports.validatePlanChange = exports.getSubscriptionStats = exports.markSubscriptionAsExpired = exports.getExpiredSubscriptions = exports.getSubscriptionsExpiringSoon = exports.processSubscriptionRenewal = exports.canAccessEnterpriseFeatures = exports.canAccessPremiumFeatures = exports.getMaxJobsForPlan = exports.getSubscriptionFeatures = exports.checkSubscriptionStatus = void 0;
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const logger_1 = require("./logger");
const paymentService_1 = require("./paymentService");
/**
 * Check if a user has an active subscription
 */
const checkSubscriptionStatus = async (userId) => {
    try {
        const subscription = await Subscription_1.Subscription.findOne({
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
    }
    catch (error) {
        logger_1.logger.error('Check subscription status failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        return null;
    }
};
exports.checkSubscriptionStatus = checkSubscriptionStatus;
/**
 * Get subscription features based on plan
 */
const getSubscriptionFeatures = (plan) => {
    const planDetails = paymentService_1.SUBSCRIPTION_PLANS[plan];
    return planDetails ? planDetails.features : [];
};
exports.getSubscriptionFeatures = getSubscriptionFeatures;
/**
 * Get maximum jobs allowed for a subscription plan
 */
const getMaxJobsForPlan = (plan) => {
    const planDetails = paymentService_1.SUBSCRIPTION_PLANS[plan];
    return planDetails ? planDetails.maxJobs : 0;
};
exports.getMaxJobsForPlan = getMaxJobsForPlan;
/**
 * Check if user can access premium features
 */
const canAccessPremiumFeatures = async (userId) => {
    try {
        const subscriptionStatus = await (0, exports.checkSubscriptionStatus)(userId);
        if (!subscriptionStatus || !subscriptionStatus.isActive) {
            return false;
        }
        const plan = subscriptionStatus.plan;
        return plan === 'premium' || plan === 'enterprise';
    }
    catch (error) {
        logger_1.logger.error('Check premium features access failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        return false;
    }
};
exports.canAccessPremiumFeatures = canAccessPremiumFeatures;
/**
 * Check if user can access enterprise features
 */
const canAccessEnterpriseFeatures = async (userId) => {
    try {
        const subscriptionStatus = await (0, exports.checkSubscriptionStatus)(userId);
        if (!subscriptionStatus || !subscriptionStatus.isActive) {
            return false;
        }
        return subscriptionStatus.plan === 'enterprise';
    }
    catch (error) {
        logger_1.logger.error('Check enterprise features access failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        return false;
    }
};
exports.canAccessEnterpriseFeatures = canAccessEnterpriseFeatures;
/**
 * Process subscription renewal
 */
const processSubscriptionRenewal = async (options) => {
    try {
        const { userId, plan, amount, autoRenew = false } = options;
        // Check if plan is valid
        if (!paymentService_1.SUBSCRIPTION_PLANS[plan]) {
            throw new Error(`Invalid subscription plan: ${plan}`);
        }
        // Calculate subscription dates
        const startDate = new Date();
        const endDate = (0, paymentService_1.calculateSubscriptionEndDate)(plan, startDate);
        // Create renewal subscription
        const renewalSubscription = new Subscription_1.Subscription({
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
        logger_1.logger.info('Subscription renewal processed', {
            userId,
            plan,
            amount,
            subscriptionId: renewalSubscription._id,
            autoRenew
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Process subscription renewal failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: options.userId,
            plan: options.plan
        });
        return false;
    }
};
exports.processSubscriptionRenewal = processSubscriptionRenewal;
/**
 * Get subscriptions expiring soon (within specified days)
 */
const getSubscriptionsExpiringSoon = async (daysThreshold = 7) => {
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
        const expiringSubscriptions = await Subscription_1.Subscription.find({
            status: 'completed',
            endDate: { $lte: thresholdDate, $gt: new Date() }
        }).populate('userId', 'email name');
        const notifications = [];
        for (const subscription of expiringSubscriptions) {
            const daysUntilExpiry = Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0) {
                notifications.push({
                    userId: subscription.userId.toString(),
                    subscriptionId: subscription._id.toString(),
                    plan: subscription.plan,
                    daysUntilExpiry,
                    email: subscription.userId.email,
                    name: subscription.userId.name
                });
            }
        }
        return notifications;
    }
    catch (error) {
        logger_1.logger.error('Get subscriptions expiring soon failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            daysThreshold
        });
        return [];
    }
};
exports.getSubscriptionsExpiringSoon = getSubscriptionsExpiringSoon;
/**
 * Get expired subscriptions that need status update
 */
const getExpiredSubscriptions = async () => {
    try {
        const expiredSubscriptions = await Subscription_1.Subscription.find({
            status: 'completed',
            endDate: { $lte: new Date() }
        }).select('_id');
        return expiredSubscriptions.map(sub => sub._id.toString());
    }
    catch (error) {
        logger_1.logger.error('Get expired subscriptions failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return [];
    }
};
exports.getExpiredSubscriptions = getExpiredSubscriptions;
/**
 * Update subscription status to expired
 */
const markSubscriptionAsExpired = async (subscriptionId) => {
    try {
        const subscription = await Subscription_1.Subscription.findById(subscriptionId);
        if (!subscription) {
            return false;
        }
        subscription.status = 'expired';
        await subscription.save();
        // Update user subscription status
        await User_1.User.findByIdAndUpdate(subscription.userId, {
            subscriptionStatus: 'expired'
        });
        logger_1.logger.info('Subscription marked as expired', {
            subscriptionId,
            userId: subscription.userId
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Mark subscription as expired failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriptionId
        });
        return false;
    }
};
exports.markSubscriptionAsExpired = markSubscriptionAsExpired;
/**
 * Get subscription statistics for dashboard
 */
const getSubscriptionStats = async () => {
    try {
        const now = new Date();
        // Basic counts
        const totalSubscriptions = await Subscription_1.Subscription.countDocuments();
        const activeSubscriptions = await Subscription_1.Subscription.countDocuments({
            status: 'completed',
            endDate: { $gt: now }
        });
        const expiredSubscriptions = await Subscription_1.Subscription.countDocuments({
            status: 'completed',
            endDate: { $lte: now }
        });
        const pendingSubscriptions = await Subscription_1.Subscription.countDocuments({
            status: 'pending'
        });
        // Plan distribution
        const planDistribution = await Subscription_1.Subscription.aggregate([
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
        const monthlyTrends = await Subscription_1.Subscription.aggregate([
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
    }
    catch (error) {
        logger_1.logger.error('Get subscription stats failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
};
exports.getSubscriptionStats = getSubscriptionStats;
/**
 * Validate subscription plan upgrade/downgrade
 */
const validatePlanChange = (currentPlan, newPlan) => {
    const plans = Object.keys(paymentService_1.SUBSCRIPTION_PLANS);
    const currentIndex = plans.indexOf(currentPlan);
    const newIndex = plans.indexOf(newPlan);
    if (currentIndex === -1 || newIndex === -1) {
        return false;
    }
    // Allow any plan change (upgrade or downgrade)
    return true;
};
exports.validatePlanChange = validatePlanChange;
/**
 * Calculate prorated amount for plan changes
 */
const calculateProratedAmount = (currentPlan, newPlan, daysRemaining, currentAmount) => {
    try {
        const currentPlanDetails = paymentService_1.SUBSCRIPTION_PLANS[currentPlan];
        const newPlanDetails = paymentService_1.SUBSCRIPTION_PLANS[newPlan];
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
    }
    catch (error) {
        logger_1.logger.error('Calculate prorated amount failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            currentPlan,
            newPlan,
            daysRemaining
        });
        return paymentService_1.SUBSCRIPTION_PLANS[newPlan]?.price || 0;
    }
};
exports.calculateProratedAmount = calculateProratedAmount;
//# sourceMappingURL=subscriptionService.js.map