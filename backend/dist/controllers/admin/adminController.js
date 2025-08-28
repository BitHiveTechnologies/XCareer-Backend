"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.getJobAnalytics = exports.getUserAnalytics = exports.getDashboardStats = void 0;
const User_1 = require("../../models/User");
const Job_1 = require("../../models/Job");
const Subscription_1 = require("../../models/Subscription");
const JobApplication_1 = require("../../models/JobApplication");
const logger_1 = require("../../utils/logger");
/**
 * Get comprehensive dashboard statistics
 */
const getDashboardStats = async (req, res) => {
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
        const [totalUsers, activeUsers, totalJobs, activeJobs, totalSubscriptions, activeSubscriptions, totalApplications, pendingApplications] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({ subscriptionStatus: 'active' }),
            Job_1.Job.countDocuments(),
            Job_1.Job.countDocuments({ isActive: true }),
            Subscription_1.Subscription.countDocuments(),
            Subscription_1.Subscription.countDocuments({ status: 'completed' }),
            JobApplication_1.JobApplication.countDocuments(),
            JobApplication_1.JobApplication.countDocuments({ status: 'applied' })
        ]);
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [newUsersThisMonth, newJobsThisMonth, newSubscriptionsThisMonth] = await Promise.all([
            User_1.User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Job_1.Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Subscription_1.Subscription.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ]);
        // Get subscription plan distribution
        const subscriptionPlans = await User_1.User.aggregate([
            {
                $group: {
                    _id: '$subscriptionPlan',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get user role distribution
        const userRoles = await User_1.User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get job type distribution
        const jobTypes = await Job_1.Job.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);
        logger_1.logger.info('Admin dashboard stats retrieved', {
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
    }
    catch (error) {
        logger_1.logger.error('Get dashboard stats failed', {
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
exports.getDashboardStats = getDashboardStats;
/**
 * Get comprehensive user analytics
 */
const getUserAnalytics = async (req, res) => {
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
        const userTrends = await User_1.User.aggregate([
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
        const subscriptionAnalytics = await User_1.User.aggregate([
            {
                $group: {
                    _id: '$subscriptionStatus',
                    count: { $sum: 1 },
                    users: { $push: { id: '$_id', email: '$email', name: '$name' } }
                }
            }
        ]);
        // Get profile completion analytics
        const profileCompletion = await User_1.User.aggregate([
            {
                $group: {
                    _id: '$isProfileComplete',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get user engagement (users with job applications)
        const userEngagement = await JobApplication_1.JobApplication.aggregate([
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
        logger_1.logger.info('User analytics retrieved', {
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
    }
    catch (error) {
        logger_1.logger.error('Get user analytics failed', {
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
exports.getUserAnalytics = getUserAnalytics;
/**
 * Get comprehensive job analytics
 */
const getJobAnalytics = async (req, res) => {
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
        const [totalJobs, activeJobs, totalApplications, averageApplicationsPerJob] = await Promise.all([
            Job_1.Job.countDocuments(),
            Job_1.Job.countDocuments({ isActive: true }),
            JobApplication_1.JobApplication.countDocuments(),
            Job_1.Job.aggregate([
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
        const jobTypeDistribution = await Job_1.Job.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get location distribution
        const locationDistribution = await Job_1.Job.aggregate([
            {
                $group: {
                    _id: '$location',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get application status distribution
        const applicationStatusDistribution = await JobApplication_1.JobApplication.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get top performing jobs (most applications)
        const topJobs = await Job_1.Job.aggregate([
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
        logger_1.logger.info('Job analytics retrieved', {
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
    }
    catch (error) {
        logger_1.logger.error('Get job analytics failed', {
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
exports.getJobAnalytics = getJobAnalytics;
/**
 * Get system health and performance metrics
 */
const getSystemHealth = async (req, res) => {
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
            users: await User_1.User.countDocuments(),
            jobs: await Job_1.Job.countDocuments(),
            subscriptions: await Subscription_1.Subscription.countDocuments(),
            applications: await JobApplication_1.JobApplication.countDocuments()
        };
        // Get recent system activity
        const recentActivity = {
            lastUserRegistration: await User_1.User.findOne().sort({ createdAt: -1 }).select('createdAt'),
            lastJobPosting: await Job_1.Job.findOne().sort({ createdAt: -1 }).select('createdAt'),
            lastSubscription: await Subscription_1.Subscription.findOne().sort({ createdAt: -1 }).select('createdAt'),
            lastApplication: await JobApplication_1.JobApplication.findOne().sort({ createdAt: -1 }).select('createdAt')
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
        logger_1.logger.info('System health metrics retrieved', {
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
    }
    catch (error) {
        logger_1.logger.error('Get system health failed', {
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
exports.getSystemHealth = getSystemHealth;
//# sourceMappingURL=adminController.js.map