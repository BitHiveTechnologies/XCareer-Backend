import { Request, Response } from 'express';
import { Subscription } from '../../models/Subscription';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { 
  SUBSCRIPTION_PLANS, 
  calculateSubscriptionEndDate,
  getPlanDetails 
} from '../../utils/paymentService';

/**
 * Get user's current subscription
 */
export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by email (JWT provides email)
    const user = await User.findOne({ email: req.user?.email });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get current active subscription
    const subscription = await Subscription.findOne({ 
      userId: user._id, 
      status: 'completed' 
    }).sort({ endDate: -1 });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          message: 'No active subscription found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get plan details
    const planDetails = getPlanDetails(subscription.plan);
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          planDetails,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount,
          daysRemaining: Math.max(0, daysRemaining),
          isActive: daysRemaining > 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get current subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all available subscription plans
 */
export const getAvailablePlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS);

    res.status(200).json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          maxJobs: plan.maxJobs,
          priority: plan.priority
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get available plans failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: _req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription plans'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription history for a user
 */
export const getSubscriptionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // Get subscriptions
    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Subscription.countDocuments(query);

    // Enhance subscription data with plan details
    const enhancedSubscriptions = subscriptions.map(sub => {
      const planDetails = getPlanDetails(sub.plan);
      const now = new Date();
      const daysRemaining = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: sub._id,
        plan: sub.plan,
        planDetails,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        amount: sub.amount,
        daysRemaining: Math.max(0, daysRemaining),
        isActive: daysRemaining > 0,
        createdAt: sub.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions: enhancedSubscriptions,
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
    logger.error('Get subscription history failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription history'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { subscriptionId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find subscription
    const subscription = await Subscription.findOne({ 
      _id: subscriptionId, 
      userId 
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Subscription not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (subscription.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Only active subscriptions can be cancelled'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if subscription has expired
    const now = new Date();
    if (subscription.endDate <= now) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Subscription has already expired'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Cancel subscription (set end date to now)
    subscription.endDate = now;
    subscription.status = 'cancelled';
    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'inactive'
    });

    logger.info('Subscription cancelled', {
      userId,
      subscriptionId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.endDate
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cancel subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      subscriptionId: req.params.subscriptionId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { plan, amount } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate plan
    if (!getPlanDetails(plan)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid subscription plan'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user has active subscription
    const activeSubscription = await Subscription.findOne({ 
      userId, 
      status: 'completed',
      endDate: { $gt: new Date() }
    });

    if (activeSubscription) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User already has an active subscription'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create renewal subscription
    const startDate = new Date();
    const endDate = calculateSubscriptionEndDate(plan, startDate);

    const renewalSubscription = new Subscription({
      userId,
      plan,
      amount,
      status: 'pending', // Will be updated when payment is verified
      startDate,
      endDate,
      paymentId: 'pending',
      orderId: 'pending'
    });

    await renewalSubscription.save();

    logger.info('Subscription renewal initiated', {
      userId,
      plan,
      amount,
      subscriptionId: renewalSubscription._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Subscription renewal initiated',
      data: {
        subscription: {
          id: renewalSubscription._id,
          plan: renewalSubscription.plan,
          status: renewalSubscription.status,
          startDate: renewalSubscription.startDate,
          endDate: renewalSubscription.endDate,
          amount: renewalSubscription.amount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Renew subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to renew subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription analytics (admin only)
 */
export const getSubscriptionAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get subscription statistics
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ 
      status: 'completed',
      endDate: { $gt: new Date() }
    });
    const expiredSubscriptions = await Subscription.countDocuments({ 
      status: 'completed',
      endDate: { $lte: new Date() }
    });
    const cancelledSubscriptions = await Subscription.countDocuments({ 
      status: 'cancelled' 
    });

    // Get plan distribution
    const planStats = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get monthly subscription trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
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

    // Get renewal rate
    const usersWithMultipleSubscriptions = await Subscription.aggregate([
      {
        $group: {
          _id: '$userId',
          subscriptionCount: { $sum: 1 }
        }
      },
      {
        $match: {
          subscriptionCount: { $gt: 1 }
        }
      }
    ]);

    const renewalRate = totalSubscriptions > 0 ? 
      (usersWithMultipleSubscriptions.length / totalSubscriptions * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          renewalRate: parseFloat(renewalRate.toString())
        },
        planDistribution: planStats,
        monthlyTrends,
        revenueMetrics: {
          totalRevenue: planStats.reduce((sum, plan) => sum + plan.totalAmount, 0),
          averageRevenuePerSubscription: totalSubscriptions > 0 ? 
            (planStats.reduce((sum, plan) => sum + plan.totalAmount, 0) / totalSubscriptions).toFixed(2) : 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription analytics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Process subscription expiry (cron job endpoint)
 */
export const processSubscriptionExpiry = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    // Find expired subscriptions
    const expiredSubscriptions = await Subscription.find({
      status: 'completed',
      endDate: { $lte: now }
    });

    let processedCount = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status
        subscription.status = 'expired';
        await subscription.save();

        // Update user subscription status
        await User.findByIdAndUpdate(subscription.userId, {
          subscriptionStatus: 'expired'
        });

        // Log expiry
        logger.info('Subscription expired', {
          userId: subscription.userId,
          subscriptionId: subscription._id,
          plan: subscription.plan
        });

        processedCount++;
      } catch (error) {
        logger.error('Failed to process subscription expiry', {
          error: error instanceof Error ? error.message : 'Unknown error',
          subscriptionId: subscription._id,
          userId: subscription.userId
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Subscription expiry processing completed',
      data: {
        processedCount,
        totalExpired: expiredSubscriptions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Process subscription expiry failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: _req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process subscription expiry'
      },
      timestamp: new Date().toISOString()
    });
  }
};
