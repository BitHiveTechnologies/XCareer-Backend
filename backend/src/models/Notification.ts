import mongoose, { Schema } from 'mongoose';

// Notification interface
export interface INotification extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'job_alert' | 'subscription' | 'payment' | 'system' | 'profile' | 'application';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.Mixed,
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
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      delete (ret as any).__v;
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
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function(): void {
  this.isRead = true;
  this.readAt = new Date();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function(): void {
  this.isRead = false;
  this.readAt = undefined;
};

// Instance method to check if notification is expired
notificationSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to get time since creation
notificationSchema.methods.getTimeSinceCreation = function(): number {
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)); // Minutes
};

// Instance method to get time since read
notificationSchema.methods.getTimeSinceRead = function(): number | null {
  if (!this.readAt) return null;
  const now = new Date();
  const readAt = new Date(this.readAt);
  return Math.floor((now.getTime() - readAt.getTime()) / (1000 * 60)); // Minutes
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ userId, isRead: false }).sort({ createdAt: -1 });
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(userId: string, type: string) {
  return this.find({ userId, type }).sort({ createdAt: -1 });
};

// Static method to find notifications by priority
notificationSchema.statics.findByPriority = function(userId: string, priority: string) {
  return this.find({ userId, priority }).sort({ createdAt: -1 });
};

// Static method to find expired notifications
notificationSchema.statics.findExpired = function() {
  return this.find({ expiresAt: { $lt: new Date() } });
};

// Static method to get notification statistics for user
notificationSchema.statics.getUserStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
notificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data: Partial<INotification>) {
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
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for read age
notificationSchema.virtual('readAge').get(function() {
  if (!this.isRead || !this.readAt) return null;
  const now = new Date();
  const read = new Date(this.readAt);
  return Math.floor((now.getTime() - read.getTime()) / (1000 * 60 * 60 * 24)); // days
});

// Ensure virtuals are serialized
notificationSchema.set('toJSON', { virtuals: true });

// Create and export the model
const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
