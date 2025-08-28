import { Request, Response } from 'express';
import { Subscription } from '../../models/Subscription';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';

// Extend Request to include user from Clerk middleware
interface AdminRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
    clerkUserId: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Get all subscriptions with pagination and filtering
 */
export const getAllSubscriptions = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      status = '',
      plan = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }

    if (plan) {
      filter.plan = plan;
    }

    if (search) {
      // Search by user email or name
      const users = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      if (users.length > 0) {
        filter.userId = { $in: users.map(u => u._id) };
      } else {
        // No users found, return empty result
        res.status(200).json({
          success: true,
          data: {
            subscriptions: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalSubscriptions: 0,
              hasNextPage: false,
              hasPrevPage: false,
              limit: limitNum
            }
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get subscriptions with pagination
    const [subscriptions, totalSubscriptions] = await Promise.all([
      Subscription.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'email firstName lastName')
        .lean(),
      Subscription.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalSubscriptions / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Admin retrieved subscriptions list', {
      adminId,
      adminRole,
      totalSubscriptions,
      page: pageNum,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalSubscriptions,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all subscriptions failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscriptions'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get subscription details by ID
 */
export const getSubscriptionById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { subscriptionId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const subscription = await Subscription.findById(subscriptionId)
      .populate('userId', 'email firstName lastName role')
      .lean();

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

    logger.info('Admin retrieved subscription details', {
      adminId,
      adminRole,
      targetSubscriptionId: subscriptionId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { subscription },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription by ID failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetSubscriptionId: req.params.subscriptionId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription details'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update subscription status and details
 */
export const updateSubscription = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { subscriptionId } = req.params;
    const { status, plan, startDate, endDate, isActive, adminNotes } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (plan) updateData.plan = plan;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (adminNotes) {
      updateData.adminNotes = {
        notes: adminNotes,
        updatedBy: adminId,
        updatedAt: new Date()
      };
    }

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'email firstName lastName');

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

    // Update user's subscription status if subscription status changed
    if (status && status !== subscription.status) {
      await User.findByIdAndUpdate(subscription.userId, {
        subscriptionStatus: status,
        updatedAt: new Date()
      });
    }

    logger.info('Admin updated subscription', {
      adminId,
      adminRole,
      targetSubscriptionId: subscriptionId,
      changes: updateData,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { subscription },
      message: 'Subscription updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetSubscriptionId: req.params.subscriptionId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { subscriptionId } = req.params;
    const { reason, refundAmount } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const subscription = await Subscription.findById(subscriptionId);
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

    // Cancel subscription
    const updateData: any = {
      status: 'cancelled',
      isActive: false,
      cancelledAt: new Date(),
      cancelledBy: adminId,
      cancellationReason: reason || 'Admin cancellation'
    };

    if (refundAmount) {
      updateData.refundAmount = refundAmount;
      updateData.refundedAt = new Date();
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'email firstName lastName');

    // Update user's subscription status
    await User.findByIdAndUpdate(subscription.userId, {
      subscriptionStatus: 'cancelled',
      updatedAt: new Date()
    });

    logger.info('Admin cancelled subscription', {
      adminId,
      adminRole,
      targetSubscriptionId: subscriptionId,
      reason,
      refundAmount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { subscription: updatedSubscription },
      message: 'Subscription cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cancel subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetSubscriptionId: req.params.subscriptionId,
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
 * Get subscription analytics and metrics
 */
export const getSubscriptionAnalytics = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { period = '30d' } = req.query;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get subscription statistics
    const [
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active', isActive: true }),
      Subscription.countDocuments({ status: 'cancelled' }),
      Subscription.countDocuments({ status: 'expired' })
    ]);

    // Get subscription plan distribution
    const planDistribution = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    // Get subscription status distribution
    const statusDistribution = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get new subscriptions in the period
    const newSubscriptions = await Subscription.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get revenue analytics
    const revenueAnalytics = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get churn rate (cancelled subscriptions in period)
    const churnedSubscriptions = await Subscription.countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: startDate, $lte: endDate }
    });

    const churnRate = totalSubscriptions > 0 ? (churnedSubscriptions / totalSubscriptions) * 100 : 0;

    logger.info('Admin retrieved subscription analytics', {
      adminId,
      adminRole,
      period,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          cancelledSubscriptions,
          expiredSubscriptions
        },
        distributions: {
          plans: planDistribution,
          statuses: statusDistribution
        },
        metrics: {
          newSubscriptions,
          churnedSubscriptions,
          churnRate: Math.round(churnRate * 100) / 100
        },
        revenue: {
          timeline: revenueAnalytics,
          totalRevenue: revenueAnalytics.reduce((sum, item) => sum + item.revenue, 0)
        },
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
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
 * Bulk update subscriptions
 */
export const bulkUpdateSubscriptions = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { subscriptionIds, updates } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Subscription IDs array is required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update multiple subscriptions
    const result = await Subscription.updateMany(
      { _id: { $in: subscriptionIds } },
      { ...updates, updatedAt: new Date() }
    );

    // If status is being updated, also update user subscription statuses
    if (updates.status) {
      const subscriptions = await Subscription.find({ _id: { $in: subscriptionIds } });
      const userIds = subscriptions.map(s => s.userId);
      
      await User.updateMany(
        { _id: { $in: userIds } },
        { subscriptionStatus: updates.status, updatedAt: new Date() }
      );
    }

    logger.info('Admin bulk updated subscriptions', {
      adminId,
      adminRole,
      targetSubscriptionIds: subscriptionIds,
      updates,
      modifiedCount: result.modifiedCount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        totalRequested: subscriptionIds.length
      },
      message: `Successfully updated ${result.modifiedCount} subscriptions`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bulk update subscriptions failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to bulk update subscriptions'
      },
      timestamp: new Date().toISOString()
    });
  }
};
