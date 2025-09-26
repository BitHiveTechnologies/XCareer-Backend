import { Request, Response } from 'express';
import { Job } from '../../models/Job';
import { JobApplication } from '../../models/JobApplication';
import ResumeTemplate from '../../models/ResumeTemplate';
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
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
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

    // Get real-time statistics
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalSubscriptions,
      activeSubscriptions,
      totalApplications,
      pendingApplications
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionStatus: 'active' }),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'completed' }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ status: 'applied' })
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newUsersThisMonth,
      newJobsThisMonth,
      newSubscriptionsThisMonth
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Subscription.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Get subscription plan distribution
    const subscriptionPlans = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionPlan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user role distribution
    const userRoles = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get job type distribution
    const jobTypes = await Job.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    logger.info('Admin dashboard stats retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalJobs,
          activeJobs,
          totalSubscriptions,
          activeSubscriptions,
          totalApplications,
          pendingApplications
        },
        monthlyGrowth: {
          newUsers: newUsersThisMonth,
          newJobs: newJobsThisMonth,
          newSubscriptions: newSubscriptionsThisMonth
        },
        distributions: {
          subscriptionPlans,
          userRoles,
          jobTypes
        },
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get dashboard stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get dashboard statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get comprehensive user analytics
 */
export const getUserAnalytics = async (req: AdminRequest, res: Response): Promise<void> => {
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

    const { period = '30d' } = req.query;
    
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

    // Get user registration trends
    const userTrends = await User.aggregate([
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get subscription analytics
    const subscriptionAnalytics = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionStatus',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', email: '$email', name: '$name' } }
        }
      }
    ]);

    // Get profile completion analytics
    const profileCompletion = await User.aggregate([
      {
        $group: {
          _id: '$isProfileComplete',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user engagement (users with job applications)
    const userEngagement = await JobApplication.aggregate([
      {
        $group: {
          _id: '$userId',
          applicationCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalEngagedUsers: { $sum: 1 },
          averageApplications: { $avg: '$applicationCount' }
        }
      }
    ]);

    logger.info('User analytics retrieved', {
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
        userTrends,
        subscriptionAnalytics,
        profileCompletion,
        userEngagement: userEngagement[0] || { totalEngagedUsers: 0, averageApplications: 0 },
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user analytics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get comprehensive job analytics
 */
export const getJobAnalytics = async (req: AdminRequest, res: Response): Promise<void> => {
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

    // Get job statistics
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      averageApplicationsPerJob
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      JobApplication.countDocuments(),
      Job.aggregate([
        {
          $lookup: {
            from: 'jobapplications',
            localField: '_id',
            foreignField: 'jobId',
            as: 'applications'
          }
        },
        {
          $group: {
            _id: null,
            averageApplications: { $avg: { $size: '$applications' } }
          }
        }
      ])
    ]);

    // Get job type distribution
    const jobTypeDistribution = await Job.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get location distribution
    const locationDistribution = await Job.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get application status distribution
    const applicationStatusDistribution = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing jobs (most applications)
    const topJobs = await Job.aggregate([
      {
        $lookup: {
          from: 'jobapplications',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications'
        }
      },
      {
        $addFields: {
          applicationCount: { $size: '$applications' }
        }
      },
      {
        $sort: { applicationCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 1,
          title: 1,
          company: 1,
          applicationCount: 1,
          isActive: 1
        }
      }
    ]);

    logger.info('Job analytics retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalJobs,
          activeJobs,
          totalApplications,
          averageApplicationsPerJob: averageApplicationsPerJob[0]?.averageApplications || 0
        },
        distributions: {
          jobTypes: jobTypeDistribution,
          locations: locationDistribution,
          applicationStatuses: applicationStatusDistribution
        },
        topJobs,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job analytics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get system health and performance metrics
 */
export const getSystemHealth = async (req: AdminRequest, res: Response): Promise<void> => {
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

    // Get database statistics
    const dbStats = {
      users: await User.countDocuments(),
      jobs: await Job.countDocuments().catch(() => 0), // Handle if Job model doesn't exist
      subscriptions: await Subscription.countDocuments(),
      applications: await JobApplication.countDocuments()
    };

    // Get recent system activity
    const recentActivity = {
      lastUserRegistration: await User.findOne().sort({ createdAt: -1 }).select('createdAt').catch(() => null),
      lastJobPosting: await Job.findOne().sort({ createdAt: -1 }).select('createdAt').catch(() => null),
      lastSubscription: await Subscription.findOne().sort({ createdAt: -1 }).select('createdAt').catch(() => null),
      lastApplication: await JobApplication.findOne().sort({ createdAt: -1 }).select('createdAt').catch(() => null)
    };

    // Calculate system uptime (simplified)
    const systemUptime = process.uptime();
    const uptimeFormatted = {
      days: Math.floor(systemUptime / 86400),
      hours: Math.floor((systemUptime % 86400) / 3600),
      minutes: Math.floor((systemUptime % 3600) / 60),
      seconds: Math.floor(systemUptime % 60)
    };

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    logger.info('System health metrics retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        database: dbStats,
        recentActivity,
        system: {
          uptime: uptimeFormatted,
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
          },
          nodeVersion: process.version,
          platform: process.platform
        },
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get system health failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get system health metrics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get comprehensive subscription management data
 */
export const getSubscriptionManagement = async (req: AdminRequest, res: Response): Promise<void> => {
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

    // Get subscription statistics
    const [
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      failedSubscriptions
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'completed' }),
      Subscription.countDocuments({ status: 'cancelled' }),
      Subscription.countDocuments({ status: 'expired' }),
      Subscription.countDocuments({ status: 'failed' })
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

    // Get recent subscription activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscriptions = await Subscription.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('userId', 'email firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20)
    .select('userId plan status amount startDate endDate createdAt');

    // Get revenue analytics
    const revenueAnalytics = await Subscription.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyRevenue: { $sum: '$amount' },
          subscriptionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get expiring subscriptions (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSubscriptions = await Subscription.find({
      status: 'completed',
      endDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    })
    .populate('userId', 'email firstName lastName')
    .select('userId plan endDate amount');

    // Get failed payment subscriptions
    const failedPayments = await Subscription.find({
      status: 'failed'
    })
    .populate('userId', 'email firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('userId plan amount createdAt');

    logger.info('Subscription management data retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          cancelledSubscriptions,
          expiredSubscriptions,
          failedSubscriptions
        },
        planDistribution,
        recentSubscriptions,
        revenueAnalytics,
        expiringSubscriptions,
        failedPayments,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription management failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get subscription management data'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment tracking and analytics
 */
export const getPaymentTracking = async (req: AdminRequest, res: Response): Promise<void> => {
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

    const { period = '30d' } = req.query;
    
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

    // Get payment statistics
    const [
      totalRevenue,
      successfulPayments,
      failedPayments,
      pendingPayments
    ] = await Promise.all([
      Subscription.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]),
      Subscription.countDocuments({
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Subscription.countDocuments({
        status: 'failed',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Subscription.countDocuments({
        status: 'pending',
        createdAt: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Get revenue by plan
    const revenueByPlan = await Subscription.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$plan',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment trends
    const paymentTrends = await Subscription.aggregate([
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
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          dailyRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get top paying customers
    const topCustomers = await Subscription.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
          subscriptionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          totalSpent: 1,
          subscriptionCount: 1
        }
      }
    ]);

    logger.info('Payment tracking data retrieved', {
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
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
          successfulPayments,
          failedPayments,
          pendingPayments
        },
        revenueByPlan,
        paymentTrends,
        topCustomers,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get payment tracking failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get payment tracking data'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user management data
 */
export const getUserManagement = async (req: AdminRequest, res: Response): Promise<void> => {
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

    const { page = 1, limit = 20, search, subscriptionStatus, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter object
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (subscriptionStatus) {
      filter.subscriptionStatus = subscriptionStatus;
    }
    
    if (role) {
      filter.role = role;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(filter);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$subscriptionStatus', 'active'] }, 1, 0] }
          },
          completedProfiles: {
            $sum: { $cond: ['$isProfileComplete', 1, 0] }
          }
        }
      }
    ]);

    // Get user registration trends
    const registrationTrends = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    logger.info('User management data retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalUsers / Number(limit)),
          totalUsers,
          limit: Number(limit)
        },
        statistics: userStats[0] || { totalUsers: 0, activeUsers: 0, completedProfiles: 0 },
        registrationTrends,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user management failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user management data'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get content management data (resume templates)
 */
export const getContentManagement = async (req: AdminRequest, res: Response): Promise<void> => {
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

    // Get template statistics
    const [
      totalTemplates,
      basicTemplates,
      premiumTemplates,
      enterpriseTemplates
    ] = await Promise.all([
      ResumeTemplate.countDocuments(),
      ResumeTemplate.countDocuments({ subscriptionTier: 'basic' }),
      ResumeTemplate.countDocuments({ subscriptionTier: 'premium' }),
      ResumeTemplate.countDocuments({ subscriptionTier: 'enterprise' })
    ]);

    // Get template analytics
    const templateAnalytics = await ResumeTemplate.aggregate([
      {
        $group: {
          _id: '$subscriptionTier',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Get popular templates
    const popularTemplates = await ResumeTemplate.find()
      .sort({ downloadCount: -1 })
      .limit(10)
      .select('name subscriptionTier downloadCount rating category');

    // Get template categories
    const templateCategories = await ResumeTemplate.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent template activity
    const recentTemplates = await ResumeTemplate.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name subscriptionTier category createdAt downloadCount rating');

    logger.info('Content management data retrieved', {
      adminId,
      adminRole,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTemplates,
          basicTemplates,
          premiumTemplates,
          enterpriseTemplates
        },
        analytics: templateAnalytics,
        popularTemplates,
        templateCategories,
        recentTemplates,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get content management failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get content management data'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user subscription status (admin action)
 */
export const updateUserSubscription = async (req: AdminRequest, res: Response): Promise<void> => {
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

    const { userId } = req.params;
    const { subscriptionStatus, subscriptionPlan, reason } = req.body;

    if (!userId || !subscriptionStatus) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User ID and subscription status are required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
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

    // Update user subscription
    const updateData: any = { subscriptionStatus };
    if (subscriptionPlan) {
      updateData.subscriptionPlan = subscriptionPlan;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Log the admin action
    logger.info('User subscription updated by admin', {
      adminId,
      adminRole,
      targetUserId: userId,
      oldStatus: user.subscriptionStatus,
      newStatus: subscriptionStatus,
      reason,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        message: 'User subscription updated successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update user subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};
