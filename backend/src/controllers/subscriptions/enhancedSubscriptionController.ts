import { Request, Response } from 'express';
import { Subscription } from '../../models/Subscription';
import { logger } from '../../utils/logger';

/**
 * Get subscription analytics with enhanced metrics
 */
export const getEnhancedAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = '30d', plan, source, campaign } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Build query filters
    const query: any = { createdAt: { $gte: startDate } };
    if (plan) query.plan = plan;
    if (source) query['metadata.source'] = source;
    if (campaign) query['metadata.campaign'] = campaign;
    
    // Get comprehensive analytics
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      trialSubscriptions,
      planDistribution,
      sourceDistribution,
      campaignDistribution,
      monthlyTrends,
      renewalRate,
      churnRate
    ] = await Promise.all([
      Subscription.countDocuments(query),
      Subscription.countDocuments({ ...query, status: 'completed', endDate: { $gte: now } }),
      Subscription.countDocuments({ ...query, status: 'completed', endDate: { $lt: now } }),
      Subscription.countDocuments({ ...query, status: 'cancelled' }),
      Subscription.countDocuments({ ...query, trialEndDate: { $exists: true, $gte: now } }),
      Subscription.aggregate([
        { $match: query },
        { $group: { _id: '$plan', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]),
      Subscription.aggregate([
        { $match: query },
        { $group: { _id: '$metadata.source', count: { $sum: 1 } } }
      ]),
      Subscription.aggregate([
        { $match: { ...query, 'metadata.campaign': { $exists: true } } },
        { $group: { _id: '$metadata.campaign', count: { $sum: 1 } } }
      ]),
      Subscription.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Calculate renewal rate
      (async () => {
        const usersWithMultipleSubs = await Subscription.aggregate([
          { $match: query },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]);
        const totalUsers = await Subscription.distinct('userId', query);
        return totalUsers.length > 0 ? (usersWithMultipleSubs.length / totalUsers.length * 100).toFixed(2) : 0;
      })(),
      // Calculate churn rate
      (async () => {
        const cancelledInPeriod = await Subscription.countDocuments({
          ...query,
          status: 'cancelled',
          cancellationDate: { $gte: startDate }
        });
        const activeAtStart = await Subscription.countDocuments({
          status: 'completed',
          startDate: { $lte: startDate },
          endDate: { $gte: startDate }
        });
        return activeAtStart > 0 ? (cancelledInPeriod / activeAtStart * 100).toFixed(2) : 0;
      })()
    ]);
    
    // Calculate revenue metrics
    const totalRevenue = planDistribution.reduce((sum, plan) => sum + plan.revenue, 0);
    const averageRevenuePerSubscription = totalSubscriptions > 0 ? (totalRevenue / totalSubscriptions).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          trialSubscriptions,
          renewalRate: parseFloat(renewalRate.toString()),
          churnRate: parseFloat(churnRate.toString())
        },
        distribution: {
          plans: planDistribution,
          sources: sourceDistribution,
          campaigns: campaignDistribution
        },
        trends: {
          monthly: monthlyTrends
        },
        revenue: {
          total: totalRevenue,
          average: parseFloat(averageRevenuePerSubscription.toString())
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get enhanced analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get enhanced analytics' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription insights and recommendations
 */
export const getSubscriptionInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Get user's subscription history
    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
    
    if (subscriptions.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          insights: {
            recommendation: 'Consider starting with our Basic plan to explore our features',
            nextSteps: ['Choose a subscription plan', 'Complete your profile', 'Start applying to jobs']
          }
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const currentSubscription = subscriptions[0];
    const insights = [];
    
    // Generate insights based on subscription history
    if (currentSubscription.status === 'completed' && (currentSubscription as any).isExpiringSoon()) {
      insights.push({
        type: 'warning',
        message: 'Your subscription is expiring soon',
        action: 'Renew your subscription to continue enjoying our services'
      });
    }
    
    if (currentSubscription.plan === 'basic' && subscriptions.length > 1) {
      insights.push({
        type: 'suggestion',
        message: 'Consider upgrading to Premium for more features',
        action: 'Upgrade to Premium plan for priority job matching and advanced analytics'
      });
    }
    
    if ((currentSubscription as any).isInTrial()) {
      insights.push({
        type: 'info',
        message: 'You are currently in trial period',
        action: 'Your trial will end soon. Consider subscribing to continue'
      });
    }
    
    // Calculate usage insights
    const totalDaysSubscribed = subscriptions.reduce((sum, sub) => {
      return sum + (sub as any).getTotalDuration();
    }, 0);
    
    const averageSubscriptionLength = subscriptions.length > 0 ? 
      (totalDaysSubscribed / subscriptions.length).toFixed(1) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        insights: {
          current: {
            plan: currentSubscription.plan,
            status: currentSubscription.status,
            daysRemaining: (currentSubscription as any).getDaysRemaining(),
            isActive: (currentSubscription as any).isActive(),
            isInTrial: (currentSubscription as any).isInTrial(),
            canRenew: (currentSubscription as any).canRenew()
          },
          history: {
            totalSubscriptions: subscriptions.length,
            averageLength: parseFloat(averageSubscriptionLength.toString()),
            totalDays: totalDaysSubscribed
          },
          recommendations: insights
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription insights failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get subscription insights' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update subscription settings (auto-renew, notifications, etc.)
 */
export const updateSubscriptionSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { subscriptionId, autoRenew, notifications } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const subscription = await Subscription.findOne({ 
      _id: subscriptionId, 
      userId 
    });
    
    if (!subscription) {
      res.status(404).json({
        success: false,
        error: { message: 'Subscription not found' },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Update settings
    if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }
    
    if (notifications !== undefined) {
      subscription.metadata = subscription.metadata || {};
      subscription.metadata.notes = `Notifications: ${notifications ? 'enabled' : 'disabled'}`;
    }
    
    await subscription.save();
    
    logger.info('Subscription settings updated', {
      userId,
      subscriptionId,
      autoRenew,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Subscription settings updated successfully',
      data: {
        subscription: {
          id: subscription._id,
          autoRenew: subscription.autoRenew,
          metadata: subscription.metadata
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update subscription settings failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      subscriptionId: req.body.subscriptionId,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update subscription settings' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription by metadata filters
 */
export const getSubscriptionsByMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { source, campaign, referrer } = req.query;
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build metadata query
    const metadataQuery: any = {};
    if (source) metadataQuery['metadata.source'] = source;
    if (campaign) metadataQuery['metadata.campaign'] = campaign;
    if (referrer) metadataQuery['metadata.referrer'] = referrer;
    
    const query = Object.keys(metadataQuery).length > 0 ? metadataQuery : {};
    
    const subscriptions = await Subscription.find(query)
      .populate('userId', 'email name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Subscription.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptions.map(sub => ({
          id: sub._id,
          plan: sub.plan,
          status: sub.status,
          amount: sub.amount,
          startDate: sub.startDate,
          endDate: sub.endDate,
          autoRenew: sub.autoRenew,
          metadata: sub.metadata,
          user: {
            id: sub.userId,
            email: (sub.userId as any).email,
            name: (sub.userId as any).name
          }
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscriptions by metadata failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get subscriptions by metadata' },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription statistics
 */
export const getSubscriptionStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await (Subscription as any).getStatistics();
    
    res.status(200).json({
      success: true,
      data: {
        statistics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription statistics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: _req.ip
    });
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get subscription statistics' },
      timestamp: new Date().toISOString()
    });
  }
};
