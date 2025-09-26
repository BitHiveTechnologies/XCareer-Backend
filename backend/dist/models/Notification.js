"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Notification schema
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        enum: {
            values: ['job_alert', 'subscription', 'payment', 'system', 'profile', 'application'],
            message: 'Notification type must be job_alert, subscription, payment, system, profile, or application'
        },
        required: [true, 'Notification type is required'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Priority must be low, medium, high, or urgent'
        },
        default: 'medium',
        index: true
    },
    category: {
        type: String,
        enum: {
            values: ['info', 'success', 'warning', 'error'],
            message: 'Category must be info, success, warning, or error'
        },
        default: 'info',
        index: true
    },
    actionUrl: {
        type: String,
        maxlength: [500, 'Action URL cannot exceed 500 characters']
    },
    actionText: {
        type: String,
        maxlength: [100, 'Action text cannot exceed 100 characters']
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 } // TTL index
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
// Compound indexes for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
// Pre-save middleware to set readAt when isRead changes
notificationSchema.pre('save', function (next) {
    if (this.isModified('isRead') && this.isRead && !this.readAt) {
        this.readAt = new Date();
    }
    next();
});
// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
};
// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function () {
    this.isRead = false;
    this.readAt = undefined;
};
// Instance method to check if notification is expired
notificationSchema.methods.isExpired = function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
};
// Instance method to get time since creation
notificationSchema.methods.getTimeSinceCreation = function () {
    const now = new Date();
    const createdAt = new Date(this.createdAt);
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)); // Minutes
};
// Instance method to get time since read
notificationSchema.methods.getTimeSinceRead = function () {
    if (!this.readAt)
        return null;
    const now = new Date();
    const readAt = new Date(this.readAt);
    return Math.floor((now.getTime() - readAt.getTime()) / (1000 * 60)); // Minutes
};
// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function (userId) {
    return this.find({ userId, isRead: false }).sort({ createdAt: -1 });
};
// Static method to find notifications by type
notificationSchema.statics.findByType = function (userId, type) {
    return this.find({ userId, type }).sort({ createdAt: -1 });
};
// Static method to find notifications by priority
notificationSchema.statics.findByPriority = function (userId, priority) {
    return this.find({ userId, priority }).sort({ createdAt: -1 });
};
// Static method to find expired notifications
notificationSchema.statics.findExpired = function () {
    return this.find({ expiresAt: { $lt: new Date() } });
};
// Static method to get notification statistics for user
notificationSchema.statics.getUserStats = function (userId) {
    return this.aggregate([
        { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
};
// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
};
// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};
// Static method to create notification
notificationSchema.statics.createNotification = function (data) {
    return this.create({
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
};
// Virtual for notification age
notificationSchema.virtual('age').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
});
// Virtual for read age
notificationSchema.virtual('readAge').get(function () {
    if (!this.isRead || !this.readAt)
        return null;
    const now = new Date();
    const read = new Date(this.readAt);
    return Math.floor((now.getTime() - read.getTime()) / (1000 * 60 * 60 * 24)); // days
});
// Ensure virtuals are serialized
notificationSchema.set('toJSON', { virtuals: true });
// Create and export the model
const Notification = mongoose_1.default.model('Notification', notificationSchema);
exports.default = Notification;
//# sourceMappingURL=Notification.js.map