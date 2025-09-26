import { Request, Response } from 'express';
import Notification from '../../models/Notification';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';

// Extend Request to include user from JWT middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
    clerkUserId?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Get user notifications with filtering and pagination
 */
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const {
      page = 1,
      limit = 20,
      type,
      priority,
      category,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Build filter object
    const filter: any = { userId };
    
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    // Get notifications
    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalNotifications = await Notification.countDocuments(filter);

    // Get notification statistics
    const stats = await Notification.aggregate([
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

    logger.info('User notifications retrieved', {
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
  } catch (error) {
    logger.error('Get user notifications failed', {
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

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

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

    logger.info('Notification marked as read', {
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
  } catch (error) {
    logger.error('Mark notification as read failed', {
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

/**
 * Mark all notifications as read for user
 */
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    logger.info('All notifications marked as read', {
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
  } catch (error) {
    logger.error('Mark all notifications as read failed', {
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

/**
 * Delete notification
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const notification = await Notification.findOneAndDelete({
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

    logger.info('Notification deleted', {
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
  } catch (error) {
    logger.error('Delete notification failed', {
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

/**
 * Get notification statistics for user
 */
export const getNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const stats = await Notification.aggregate([
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
    const typeStats: Record<string, { total: number; unread: number; read: number }> = {};
    notificationStats.byType.forEach((item: any) => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0, read: 0 };
      }
      typeStats[item.type].total++;
      if (item.isRead) {
        typeStats[item.type].read++;
      } else {
        typeStats[item.type].unread++;
      }
    });

    // Process priority statistics
    const priorityStats: Record<string, { total: number; unread: number; read: number }> = {};
    notificationStats.byPriority.forEach((item: any) => {
      if (!priorityStats[item.priority]) {
        priorityStats[item.priority] = { total: 0, unread: 0, read: 0 };
      }
      priorityStats[item.priority].total++;
      if (item.isRead) {
        priorityStats[item.priority].read++;
      } else {
        priorityStats[item.priority].unread++;
      }
    });

    // Process category statistics
    const categoryStats: Record<string, { total: number; unread: number; read: number }> = {};
    notificationStats.byCategory.forEach((item: any) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { total: 0, unread: 0, read: 0 };
      }
      categoryStats[item.category].total++;
      if (item.isRead) {
        categoryStats[item.category].read++;
      } else {
        categoryStats[item.category].unread++;
      }
    });

    logger.info('Notification statistics retrieved', {
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
  } catch (error) {
    logger.error('Get notification statistics failed', {
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

/**
 * Create notification (admin only)
 */
export const createNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      userId,
      type,
      title,
      message,
      data,
      priority = 'medium',
      category = 'info',
      actionUrl,
      actionText,
      expiresAt
    } = req.body;

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

    const notification = await Notification.create({
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

    logger.info('Notification created by admin', {
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
  } catch (error) {
    logger.error('Create notification failed', {
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

/**
 * Bulk create notifications (admin only)
 */
export const bulkCreateNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const createdNotifications = await Notification.insertMany(
      notifications.map(notification => ({
        ...notification,
        data: notification.data || {},
        priority: notification.priority || 'medium',
        category: notification.category || 'info',
        expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
        metadata: {
          createdBy: adminId,
          createdAt: new Date()
        }
      }))
    );

    logger.info('Bulk notifications created by admin', {
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
  } catch (error) {
    logger.error('Bulk create notifications failed', {
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
