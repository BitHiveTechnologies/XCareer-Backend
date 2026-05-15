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
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    matchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 110 // can exceed 100 with bonuses
    },
    matchReasons: {
        type: [String],
        default: []
    },
    isAutomatic: {
        type: Boolean,
        default: true
    },
    triggeredBy: {
        type: String,
        default: null
    },
    retryCount: {
        type: Number,
        default: 0
    },
    lastRetryAt: {
        type: Date,
        default: null
    },
    deliveryStatus: {
        type: String,
        default: null
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
jobNotificationSchema.index({ createdAt: -1 });
jobNotificationSchema.index({ isAutomatic: 1 });
jobNotificationSchema.index({ retryCount: 1, emailStatus: 1 });
// Index for performance — one notification per user per job
jobNotificationSchema.index({ jobId: 1, userId: 1 });
jobNotificationSchema.index({ userId: 1, emailStatus: 1 });
jobNotificationSchema.index({ jobId: 1, emailStatus: 1 });
// Pre-save: auto-set emailSentAt
jobNotificationSchema.pre('save', function (next) {
    if (this.emailSent && !this.emailSentAt) {
        this.emailSentAt = new Date();
    }
    next();
});
// Statics
jobNotificationSchema.statics.findPendingNotifications = function () {
    return this.find({ emailStatus: 'pending' });
};
jobNotificationSchema.statics.findFailedNotifications = function (maxRetries = 3) {
    return this.find({ emailStatus: 'failed', retryCount: { $lt: maxRetries } });
};
jobNotificationSchema.statics.findByJob = function (jobId) {
    return this.find({ jobId });
};
jobNotificationSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
jobNotificationSchema.statics.getNotificationStats = function () {
    return this.aggregate([
        { $group: { _id: '$emailStatus', count: { $sum: 1 } } }
    ]);
};
exports.JobNotification = mongoose_1.default.model('JobNotification', jobNotificationSchema);
//# sourceMappingURL=JobNotification.js.map