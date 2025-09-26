"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const Job_1 = require("../models/Job");
const JobApplication_1 = require("../models/JobApplication");
const Notification_1 = __importDefault(require("../models/Notification"));
const Subscription_1 = require("../models/Subscription");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Create a single notification
     */
    async createNotification(data) {
        try {
            const notification = await Notification_1.default.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data || {},
                priority: data.priority || 'medium',
                category: data.category || 'info',
                actionUrl: data.actionUrl,
                actionText: data.actionText,
                expiresAt: data.expiresAt,
                metadata: data.metadata || {}
            });
            logger_1.logger.info('Notification created', {
                notificationId: notification._id,
                userId: data.userId,
                type: data.type,
                priority: data.priority
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: data.userId,
                type: data.type
            });
            throw error;
        }
    }
    /**
     * Create multiple notifications
     */
    async createBulkNotifications(notifications) {
        try {
            const createdNotifications = await Notification_1.default.insertMany(notifications.map(data => ({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data || {},
                priority: data.priority || 'medium',
                category: data.category || 'info',
                actionUrl: data.actionUrl,
                actionText: data.actionText,
                expiresAt: data.expiresAt,
                metadata: data.metadata || {}
            })));
            logger_1.logger.info('Bulk notifications created', {
                count: createdNotifications.length,
                types: [...new Set(notifications.map(n => n.type))]
            });
            return createdNotifications;
        }
        catch (error) {
            logger_1.logger.error('Create bulk notifications failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                count: notifications.length
            });
            throw error;
        }
    }
    /**
     * Create job alert notification
     */
    async createJobAlertNotification(userId, jobId, jobData) {
        try {
            let job;
            if (jobData) {
                job = jobData;
            }
            else {
                job = await Job_1.Job.findById(jobId);
                if (!job) {
                    throw new Error('Job not found');
                }
            }
            const notification = await this.createNotification({
                userId,
                type: 'job_alert',
                title: `New Job Opportunity: ${job.title}`,
                message: `A new job opportunity matching your profile has been posted by ${job.company}.`,
                data: {
                    jobId: job._id,
                    jobTitle: job.title,
                    company: job.company,
                    location: job.location,
                    type: job.type,
                    applicationLink: job.applicationLink
                },
                priority: 'medium',
                category: 'info',
                actionUrl: job.applicationLink,
                actionText: 'Apply Now',
                metadata: {
                    source: 'job_matching',
                    jobId: job._id
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create job alert notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                jobId
            });
            throw error;
        }
    }
    /**
     * Create subscription-related notification
     */
    async createSubscriptionNotification(userId, type, subscriptionData) {
        try {
            let subscription;
            if (subscriptionData) {
                subscription = subscriptionData;
            }
            else {
                subscription = await Subscription_1.Subscription.findOne({ userId }).sort({ createdAt: -1 });
                if (!subscription) {
                    throw new Error('Subscription not found');
                }
            }
            let title;
            let message;
            let priority = 'medium';
            let category = 'info';
            switch (type) {
                case 'activated':
                    title = 'Subscription Activated';
                    message = `Your ${subscription.plan} subscription has been successfully activated.`;
                    category = 'success';
                    break;
                case 'expired':
                    title = 'Subscription Expired';
                    message = `Your ${subscription.plan} subscription has expired. Renew to continue enjoying premium features.`;
                    priority = 'high';
                    category = 'warning';
                    break;
                case 'cancelled':
                    title = 'Subscription Cancelled';
                    message = `Your ${subscription.plan} subscription has been cancelled. You can reactivate anytime.`;
                    category = 'info';
                    break;
                case 'payment_failed':
                    title = 'Payment Failed';
                    message = `Payment for your ${subscription.plan} subscription failed. Please update your payment method.`;
                    priority = 'high';
                    category = 'error';
                    break;
                case 'renewal_reminder':
                    title = 'Subscription Renewal Reminder';
                    message = `Your ${subscription.plan} subscription will renew in 3 days.`;
                    priority = 'medium';
                    category = 'info';
                    break;
                default:
                    throw new Error('Invalid subscription notification type');
            }
            const notification = await this.createNotification({
                userId,
                type: 'subscription',
                title,
                message,
                data: {
                    subscriptionId: subscription._id,
                    plan: subscription.plan,
                    amount: subscription.amount,
                    status: subscription.status,
                    endDate: subscription.endDate
                },
                priority,
                category,
                actionUrl: type === 'expired' ? '/subscriptions' : undefined,
                actionText: type === 'expired' ? 'Renew Now' : undefined,
                metadata: {
                    source: 'subscription_system',
                    subscriptionId: subscription._id,
                    notificationType: type
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create subscription notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                type
            });
            throw error;
        }
    }
    /**
     * Create payment-related notification
     */
    async createPaymentNotification(userId, type, paymentData) {
        try {
            let title;
            let message;
            let priority = 'medium';
            let category = 'info';
            switch (type) {
                case 'success':
                    title = 'Payment Successful';
                    message = 'Your payment has been processed successfully.';
                    category = 'success';
                    break;
                case 'failed':
                    title = 'Payment Failed';
                    message = 'Your payment could not be processed. Please try again.';
                    priority = 'high';
                    category = 'error';
                    break;
                case 'refunded':
                    title = 'Payment Refunded';
                    message = 'Your payment has been refunded successfully.';
                    category = 'info';
                    break;
                default:
                    throw new Error('Invalid payment notification type');
            }
            const notification = await this.createNotification({
                userId,
                type: 'payment',
                title,
                message,
                data: paymentData || {},
                priority,
                category,
                metadata: {
                    source: 'payment_system',
                    notificationType: type
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create payment notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                type
            });
            throw error;
        }
    }
    /**
     * Create application status notification
     */
    async createApplicationNotification(userId, applicationId, status, applicationData) {
        try {
            let application;
            if (applicationData) {
                application = applicationData;
            }
            else {
                application = await JobApplication_1.JobApplication.findById(applicationId).populate('jobId');
                if (!application) {
                    throw new Error('Application not found');
                }
            }
            let title;
            let message;
            let priority = 'medium';
            let category = 'info';
            switch (status) {
                case 'applied':
                    title = 'Application Submitted';
                    message = `Your application for ${application.jobId?.title || 'the position'} has been submitted successfully.`;
                    category = 'success';
                    break;
                case 'shortlisted':
                    title = 'Application Shortlisted';
                    message = `Congratulations! Your application for ${application.jobId?.title || 'the position'} has been shortlisted.`;
                    priority = 'high';
                    category = 'success';
                    break;
                case 'rejected':
                    title = 'Application Update';
                    message = `Your application for ${application.jobId?.title || 'the position'} was not selected this time.`;
                    category = 'info';
                    break;
                case 'withdrawn':
                    title = 'Application Withdrawn';
                    message = `Your application for ${application.jobId?.title || 'the position'} has been withdrawn.`;
                    category = 'info';
                    break;
                default:
                    throw new Error('Invalid application status');
            }
            const notification = await this.createNotification({
                userId,
                type: 'application',
                title,
                message,
                data: {
                    applicationId: application._id,
                    jobId: application.jobId,
                    status: application.status,
                    appliedAt: application.appliedAt
                },
                priority,
                category,
                metadata: {
                    source: 'application_system',
                    applicationId: application._id,
                    status
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create application notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                applicationId,
                status
            });
            throw error;
        }
    }
    /**
     * Create system notification
     */
    async createSystemNotification(userId, title, message, priority = 'medium', category = 'info', data) {
        try {
            const notification = await this.createNotification({
                userId,
                type: 'system',
                title,
                message,
                data: data || {},
                priority,
                category,
                metadata: {
                    source: 'system',
                    createdBy: 'system'
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create system notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                title
            });
            throw error;
        }
    }
    /**
     * Create profile completion notification
     */
    async createProfileNotification(userId, type) {
        try {
            let title;
            let message;
            let priority = 'medium';
            let category = 'info';
            switch (type) {
                case 'incomplete':
                    title = 'Complete Your Profile';
                    message = 'Your profile is incomplete. Complete it to get better job matches.';
                    priority = 'medium';
                    category = 'warning';
                    break;
                case 'complete':
                    title = 'Profile Complete';
                    message = 'Your profile has been completed successfully. You will now receive better job matches.';
                    category = 'success';
                    break;
                case 'update_required':
                    title = 'Profile Update Required';
                    message = 'Please update your profile information to continue receiving job matches.';
                    priority = 'medium';
                    category = 'warning';
                    break;
                default:
                    throw new Error('Invalid profile notification type');
            }
            const notification = await this.createNotification({
                userId,
                type: 'profile',
                title,
                message,
                priority,
                category,
                actionUrl: type === 'incomplete' || type === 'update_required' ? '/profile' : undefined,
                actionText: type === 'incomplete' || type === 'update_required' ? 'Complete Profile' : undefined,
                metadata: {
                    source: 'profile_system',
                    notificationType: type
                }
            });
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Create profile notification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                type
            });
            throw error;
        }
    }
    /**
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications() {
        try {
            const result = await Notification_1.default.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            logger_1.logger.info('Expired notifications cleaned up', {
                deletedCount: result.deletedCount
            });
            return result.deletedCount || 0;
        }
        catch (error) {
            logger_1.logger.error('Cleanup expired notifications failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get notification statistics for admin
     */
    async getAdminStats() {
        try {
            const stats = await Notification_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        unread: { $sum: { $cond: ['$isRead', 0, 1] } },
                        read: { $sum: { $cond: ['$isRead', 1, 0] } },
                        byType: {
                            $push: {
                                type: '$type',
                                isRead: '$isRead'
                            }
                        },
                        byPriority: {
                            $push: {
                                priority: '$priority',
                                isRead: '$isRead'
                            }
                        }
                    }
                }
            ]);
            return stats[0] || { total: 0, unread: 0, read: 0, byType: [], byPriority: [] };
        }
        catch (error) {
            logger_1.logger.error('Get admin notification stats failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.notificationService = new NotificationService();
exports.default = exports.notificationService;
//# sourceMappingURL=notificationService.js.map