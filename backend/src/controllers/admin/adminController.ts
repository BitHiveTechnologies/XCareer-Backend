import { Request, Response } from 'express';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { Job } from '../../models/Job';
import { Subscription } from '../../models/Subscription';
import { JobApplication } from '../../models/JobApplication';
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
      jobs: await Job.countDocuments(),
      subscriptions: await Subscription.countDocuments(),
      applications: await JobApplication.countDocuments()
    };

    // Get recent system activity
    const recentActivity = {
      lastUserRegistration: await User.findOne().sort({ createdAt: -1 }).select('createdAt'),
      lastJobPosting: await Job.findOne().sort({ createdAt: -1 }).select('createdAt'),
      lastSubscription: await Subscription.findOne().sort({ createdAt: -1 }).select('createdAt'),
      lastApplication: await JobApplication.findOne().sort({ createdAt: -1 }).select('createdAt')
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
