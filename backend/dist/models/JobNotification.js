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
exports.jobNotificationSchema = exports.JobNotification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Job Notification schema
const jobNotificationSchema = new mongoose_1.Schema({
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Job ID is required']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    emailStatus: {
        type: String,
        enum: {
            values: ['pending', 'sent', 'failed'],
            message: 'Email status must be pending, sent, or failed'
        },
        default: 'pending'
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
exports.jobNotificationSchema = jobNotificationSchema;
// Indexes for performance
jobNotificationSchema.index({ jobId: 1 });
jobNotificationSchema.index({ userId: 1 });
jobNotificationSchema.index({ emailStatus: 1 });
jobNotificationSchema.index({ emailSent: 1 });
jobNotificationSchema.index({ createdAt: -1 });
// Compound indexes for common queries
jobNotificationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
jobNotificationSchema.index({ userId: 1, emailStatus: 1 });
jobNotificationSchema.index({ jobId: 1, emailStatus: 1 });
jobNotificationSchema.index({ emailSent: 1, emailStatus: 1 });
// Pre-save middleware to set emailSentAt when email is sent
jobNotificationSchema.pre('save', function (next) {
    if (this.emailSent && !this.emailSentAt) {
        this.emailSentAt = new Date();
    }
    next();
});
// Instance method to mark email as sent
jobNotificationSchema.methods.markEmailSent = function () {
    this.emailSent = true;
    this.emailSentAt = new Date();
    this.emailStatus = 'sent';
};
// Instance method to mark email as failed
jobNotificationSchema.methods.markEmailFailed = function () {
    this.emailSent = false;
    this.emailStatus = 'failed';
};
// Instance method to reset email status
jobNotificationSchema.methods.resetEmailStatus = function () {
    this.emailSent = false;
    this.emailSentAt = null;
    this.emailStatus = 'pending';
};
// Instance method to check if notification is pending
jobNotificationSchema.methods.isPending = function () {
    return this.emailStatus === 'pending';
};
// Instance method to check if notification was sent successfully
jobNotificationSchema.methods.wasSent = function () {
    return this.emailStatus === 'sent' && this.emailSent;
};
// Instance method to check if notification failed
jobNotificationSchema.methods.hasFailed = function () {
    return this.emailStatus === 'failed';
};
// Instance method to get time since email was sent
jobNotificationSchema.methods.getTimeSinceEmailSent = function () {
    if (!this.emailSentAt)
        return null;
    const now = new Date();
    const sentAt = new Date(this.emailSentAt);
    const diffTime = now.getTime() - sentAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
};
// Static method to find pending notifications
jobNotificationSchema.statics.findPendingNotifications = function () {
    return this.find({ emailStatus: 'pending' });
};
// Static method to find failed notifications
jobNotificationSchema.statics.findFailedNotifications = function () {
    return this.find({ emailStatus: 'failed' });
};
// Static method to find notifications by job
jobNotificationSchema.statics.findByJob = function (jobId) {
    return this.find({ jobId });
};
// Static method to find notifications by user
jobNotificationSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
// Static method to find notifications by email status
jobNotificationSchema.statics.findByEmailStatus = function (status) {
    return this.find({ emailStatus: status });
};
// Static method to find notifications that need retry
jobNotificationSchema.statics.findNotificationsForRetry = function (maxRetries = 3) {
    return this.find({
        emailStatus: 'failed',
        $expr: {
            $lt: [
                { $size: { $ifNull: ['$retryCount', []] } },
                maxRetries
            ]
        }
    });
};
// Static method to find notifications by date range
jobNotificationSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        createdAt: { $gte: startDate, $lte: endDate }
    });
};
// Static method to get notification statistics
jobNotificationSchema.statics.getNotificationStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: '$emailStatus',
                count: { $sum: 1 }
            }
        }
    ]);
};
// Static method to get notification statistics by job
jobNotificationSchema.statics.getNotificationStatsByJob = function (jobId) {
    return this.aggregate([
        { $match: { jobId: new mongoose_1.default.Types.ObjectId(jobId) } },
        {
            $group: {
                _id: '$emailStatus',
                count: { $sum: 1 }
            }
        }
    ]);
};
// Virtual for email status display
jobNotificationSchema.virtual('emailStatusDisplay').get(function () {
    const statusMap = {
        pending: 'Pending',
        sent: 'Sent Successfully',
        failed: 'Failed to Send'
    };
    return statusMap[this.emailStatus] || this.emailStatus;
});
// Virtual for time since email sent
jobNotificationSchema.virtual('timeSinceEmailSent').get(function () {
    return this.getTimeSinceEmailSent();
});
// Virtual for notification summary
jobNotificationSchema.virtual('notificationSummary').get(function () {
    return {
        jobId: this.jobId,
        userId: this.userId,
        emailStatus: this.emailStatus,
        emailSent: this.emailSent,
        emailSentAt: this.emailSentAt,
        isPending: this.isPending(),
        wasSent: this.wasSent(),
        hasFailed: this.hasFailed()
    };
});
// Ensure virtuals are serialized
jobNotificationSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.JobNotification = mongoose_1.default.model('JobNotification', jobNotificationSchema);
//# sourceMappingURL=JobNotification.js.map