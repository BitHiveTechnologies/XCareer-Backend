import express from 'express';
import Joi from 'joi';
import {
    bulkCreateNotifications,
    createNotification,
    deleteNotification,
    getNotificationStats,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from '../../controllers/notifications/notificationController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import { commonSchemas, validate } from '../../middleware/validation';

const router = express.Router();

// Apply authentication to all notification routes
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications with filtering and pagination
 * @access  User
 */
router.get('/',
  validate({
    query: Joi.object({
      page: Joi.number().min(1).optional(),
      limit: Joi.number().min(1).max(100).optional(),
      type: Joi.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      category: Joi.string().valid('info', 'success', 'warning', 'error').optional(),
      isRead: Joi.boolean().optional(),
      sortBy: Joi.string().valid('createdAt', 'priority', 'type', 'category').optional(),
      sortOrder: Joi.string().valid('asc', 'desc').optional()
    })
  }),
  getUserNotifications
);

/**
 * @route   GET /api/v1/notifications/stats
 * @desc    Get notification statistics for user
 * @access  User
 */
router.get('/stats', getNotificationStats);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  User
 */
router.put('/:notificationId/read',
  validate({
    params: Joi.object({
      notificationId: commonSchemas.objectId.required()
    })
  }),
  markNotificationAsRead
);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read for user
 * @access  User
 */
router.put('/read-all', markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete notification
 * @access  User
 */
router.delete('/:notificationId',
  validate({
    params: Joi.object({
      notificationId: commonSchemas.objectId.required()
    })
  }),
  deleteNotification
);

// Admin-only routes
router.use(requireAdmin);

/**
 * @route   POST /api/v1/notifications
 * @desc    Create notification (admin only)
 * @access  Admin
 */
router.post('/',
  validate({
    body: Joi.object({
      userId: commonSchemas.objectId.required(),
      type: Joi.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').required(),
      title: Joi.string().min(1).max(200).required(),
      message: Joi.string().min(1).max(1000).required(),
      data: Joi.object({}).optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      category: Joi.string().valid('info', 'success', 'warning', 'error').optional(),
      actionUrl: Joi.string().uri().optional(),
      actionText: Joi.string().max(100).optional(),
      expiresAt: Joi.date().optional()
    })
  }),
  createNotification
);

/**
 * @route   POST /api/v1/notifications/bulk
 * @desc    Bulk create notifications (admin only)
 * @access  Admin
 */
router.post('/bulk',
  validate({
    body: Joi.object({
      notifications: Joi.array().items(
        Joi.object({
          userId: commonSchemas.objectId.required(),
          type: Joi.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').required(),
          title: Joi.string().min(1).max(200).required(),
          message: Joi.string().min(1).max(1000).required(),
          data: Joi.object({}).optional(),
          priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
          category: Joi.string().valid('info', 'success', 'warning', 'error').optional(),
          actionUrl: Joi.string().uri().optional(),
          actionText: Joi.string().max(100).optional(),
          expiresAt: Joi.date().optional()
        })
      ).min(1).required()
    })
  }),
  bulkCreateNotifications
);


export default router;
