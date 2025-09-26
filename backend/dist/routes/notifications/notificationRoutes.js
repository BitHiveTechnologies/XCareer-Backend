"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const notificationController_1 = require("../../controllers/notifications/notificationController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Apply authentication to all notification routes
router.use(jwtAuth_1.authenticate);
/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications with filtering and pagination
 * @access  User
 */
router.get('/', (0, validation_1.validate)({
    query: joi_1.default.object({
        page: joi_1.default.number().min(1).optional(),
        limit: joi_1.default.number().min(1).max(100).optional(),
        type: joi_1.default.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').optional(),
        priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
        category: joi_1.default.string().valid('info', 'success', 'warning', 'error').optional(),
        isRead: joi_1.default.boolean().optional(),
        sortBy: joi_1.default.string().valid('createdAt', 'priority', 'type', 'category').optional(),
        sortOrder: joi_1.default.string().valid('asc', 'desc').optional()
    })
}), notificationController_1.getUserNotifications);
/**
 * @route   GET /api/v1/notifications/stats
 * @desc    Get notification statistics for user
 * @access  User
 */
router.get('/stats', notificationController_1.getNotificationStats);
/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  User
 */
router.put('/:notificationId/read', (0, validation_1.validate)({
    params: joi_1.default.object({
        notificationId: validation_1.commonSchemas.objectId.required()
    })
}), notificationController_1.markNotificationAsRead);
/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read for user
 * @access  User
 */
router.put('/read-all', notificationController_1.markAllNotificationsAsRead);
/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete notification
 * @access  User
 */
router.delete('/:notificationId', (0, validation_1.validate)({
    params: joi_1.default.object({
        notificationId: validation_1.commonSchemas.objectId.required()
    })
}), notificationController_1.deleteNotification);
// Admin-only routes
router.use(jwtAuth_1.requireAdmin);
/**
 * @route   POST /api/v1/notifications
 * @desc    Create notification (admin only)
 * @access  Admin
 */
router.post('/', (0, validation_1.validate)({
    body: joi_1.default.object({
        userId: validation_1.commonSchemas.objectId.required(),
        type: joi_1.default.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').required(),
        title: joi_1.default.string().min(1).max(200).required(),
        message: joi_1.default.string().min(1).max(1000).required(),
        data: joi_1.default.object({}).optional(),
        priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
        category: joi_1.default.string().valid('info', 'success', 'warning', 'error').optional(),
        actionUrl: joi_1.default.string().uri().optional(),
        actionText: joi_1.default.string().max(100).optional(),
        expiresAt: joi_1.default.date().optional()
    })
}), notificationController_1.createNotification);
/**
 * @route   POST /api/v1/notifications/bulk
 * @desc    Bulk create notifications (admin only)
 * @access  Admin
 */
router.post('/bulk', (0, validation_1.validate)({
    body: joi_1.default.object({
        notifications: joi_1.default.array().items(joi_1.default.object({
            userId: validation_1.commonSchemas.objectId.required(),
            type: joi_1.default.string().valid('job_alert', 'subscription', 'payment', 'system', 'profile', 'application').required(),
            title: joi_1.default.string().min(1).max(200).required(),
            message: joi_1.default.string().min(1).max(1000).required(),
            data: joi_1.default.object({}).optional(),
            priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
            category: joi_1.default.string().valid('info', 'success', 'warning', 'error').optional(),
            actionUrl: joi_1.default.string().uri().optional(),
            actionText: joi_1.default.string().max(100).optional(),
            expiresAt: joi_1.default.date().optional()
        })).min(1).required()
    })
}), notificationController_1.bulkCreateNotifications);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map