"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateNotifications = exports.createNotification = exports.getNotificationStats = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = void 0;
const Notification_1 = __importDefault(require("../../models/Notification"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
/**
 * Get user notifications with filtering and pagination
 */
const getUserNotifications = async (req, res) => {
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
        const { page = 1, limit = 20, type, priority, category, isRead, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Build filter object
        const filter = { userId };
        if (type)
            filter.type = type;
        if (priority)
            filter.priority = priority;
        if (category)
            filter.category = category;
        if (isRead !== undefined)
            filter.isRead = isRead === 'true';
        // Get notifications
        const notifications = await Notification_1.default.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalNotifications = await Notification_1.default.countDocuments(filter);
        // Get notification statistics
        const stats = await Notification_1.default.aggregate([
            { $match: { userId: userId } },
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
                    }
                }
            }
        ]);
        const notificationStats = stats[0] || { total: 0, unread: 0, read: 0, byType: [] };
        logger_1.logger.info('User notifications retrieved', {
            userId,
            totalNotifications,
            filters: { type, priority, category, isRead },
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalNotifications / Number(limit)),
                    totalNotifications,
                    limit: Number(limit)
                },
                statistics: notificationStats,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get user notifications failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get notifications'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getUserNotifications = getUserNotifications;
/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
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
        const notification = await Notification_1.default.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true, readAt: new Date() }, { new: true });
        if (!notification) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Notification not found'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Notification marked as read', {
            userId,
            notificationId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                notification,
                message: 'Notification marked as read'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Mark notification as read failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            notificationId: req.params.notificationId,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to mark notification as read'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
/**
 * Mark all notifications as read for user
 */
const markAllNotificationsAsRead = async (req, res) => {
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
        const result = await Notification_1.default.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
        logger_1.logger.info('All notifications marked as read', {
            userId,
            modifiedCount: result.modifiedCount,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                message: 'All notifications marked as read',
                modifiedCount: result.modifiedCount
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Mark all notifications as read failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to mark all notifications as read'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
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
        const notification = await Notification_1.default.findOneAndDelete({
            _id: notificationId,
            userId
        });
        if (!notification) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Notification not found'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        logger_1.logger.info('Notification deleted', {
            userId,
            notificationId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                message: 'Notification deleted successfully'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Delete notification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            notificationId: req.params.notificationId,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete notification'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Get notification statistics for user
 */
const getNotificationStats = async (req, res) => {
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
        const stats = await Notification_1.default.aggregate([
            { $match: { userId: userId } },
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
                    },
                    byCategory: {
                        $push: {
                            category: '$category',
                            isRead: '$isRead'
                        }
                    }
                }
            }
        ]);
        const notificationStats = stats[0] || {
            total: 0,
            unread: 0,
            read: 0,
            byType: [],
            byPriority: [],
            byCategory: []
        };
        // Process type statistics
        const typeStats = {};
        notificationStats.byType.forEach((item) => {
            if (!typeStats[item.type]) {
                typeStats[item.type] = { total: 0, unread: 0, read: 0 };
            }
            typeStats[item.type].total++;
            if (item.isRead) {
                typeStats[item.type].read++;
            }
            else {
                typeStats[item.type].unread++;
            }
        });
        // Process priority statistics
        const priorityStats = {};
        notificationStats.byPriority.forEach((item) => {
            if (!priorityStats[item.priority]) {
                priorityStats[item.priority] = { total: 0, unread: 0, read: 0 };
            }
            priorityStats[item.priority].total++;
            if (item.isRead) {
                priorityStats[item.priority].read++;
            }
            else {
                priorityStats[item.priority].unread++;
            }
        });
        // Process category statistics
        const categoryStats = {};
        notificationStats.byCategory.forEach((item) => {
            if (!categoryStats[item.category]) {
                categoryStats[item.category] = { total: 0, unread: 0, read: 0 };
            }
            categoryStats[item.category].total++;
            if (item.isRead) {
                categoryStats[item.category].read++;
            }
            else {
                categoryStats[item.category].unread++;
            }
        });
        logger_1.logger.info('Notification statistics retrieved', {
            userId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    total: notificationStats.total,
                    unread: notificationStats.unread,
                    read: notificationStats.read
                },
                byType: typeStats,
                byPriority: priorityStats,
                byCategory: categoryStats,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get notification statistics failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get notification statistics'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getNotificationStats = getNotificationStats;
/**
 * Create notification (admin only)
 */
const createNotification = async (req, res) => {
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
        const { userId, type, title, message, data, priority = 'medium', category = 'info', actionUrl, actionText, expiresAt } = req.body;
        if (!userId || !type || !title || !message) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'User ID, type, title, and message are required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Verify user exists
        const user = await User_1.User.findById(userId);
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
        const notification = await Notification_1.default.create({
            userId,
            type,
            title,
            message,
            data: data || {},
            priority,
            category,
            actionUrl,
            actionText,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            metadata: {
                createdBy: adminId,
                createdAt: new Date()
            }
        });
        logger_1.logger.info('Notification created by admin', {
            adminId,
            adminRole,
            targetUserId: userId,
            notificationId: notification._id,
            type,
            priority,
            ip: req.ip
        });
        res.status(201).json({
            success: true,
            data: {
                notification,
                message: 'Notification created successfully'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Create notification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create notification'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.createNotification = createNotification;
/**
 * Bulk create notifications (admin only)
 */
const bulkCreateNotifications = async (req, res) => {
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
        const { notifications } = req.body;
        if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Notifications array is required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Validate each notification
        for (const notification of notifications) {
            if (!notification.userId || !notification.type || !notification.title || !notification.message) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Each notification must have userId, type, title, and message'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }
        // Create notifications
        const createdNotifications = await Notification_1.default.insertMany(notifications.map(notification => ({
            ...notification,
            data: notification.data || {},
            priority: notification.priority || 'medium',
            category: notification.category || 'info',
            expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
            metadata: {
                createdBy: adminId,
                createdAt: new Date()
            }
        })));
        logger_1.logger.info('Bulk notifications created by admin', {
            adminId,
            adminRole,
            count: createdNotifications.length,
            ip: req.ip
        });
        res.status(201).json({
            success: true,
            data: {
                notifications: createdNotifications,
                count: createdNotifications.length,
                message: 'Bulk notifications created successfully'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Bulk create notifications failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create bulk notifications'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.bulkCreateNotifications = bulkCreateNotifications;
//# sourceMappingURL=notificationController.js.map