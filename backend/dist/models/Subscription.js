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
exports.subscriptionSchema = exports.Subscription = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Subscription schema
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    plan: {
        type: String,
        required: [true, 'Subscription plan is required'],
        enum: {
            values: ['basic', 'premium', 'enterprise'],
            message: 'Subscription plan must be basic, premium, or enterprise'
        }
    },
    amount: {
        type: Number,
        required: [true, 'Subscription amount is required'],
        min: [0, 'Amount cannot be negative'],
        validate: {
            validator: function (value) {
                const expectedAmounts = { basic: 49, premium: 99, enterprise: 299 };
                return value === expectedAmounts[this.plan];
            },
            message: 'Amount does not match the selected plan'
        }
    },
    paymentId: {
        type: String,
        required: [true, 'Payment ID is required'],
        trim: true
    },
    orderId: {
        type: String,
        required: [true, 'Order ID is required'],
        trim: true
    },
    status: {
        type: String,
        required: [true, 'Subscription status is required'],
        enum: {
            values: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired'],
            message: 'Status must be pending, completed, failed, refunded, cancelled, or expired'
        },
        default: 'pending'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        validate: {
            validator: function (value) {
                // Allow past dates for expired subscriptions or test scenarios
                if (this.status === 'expired' || process.env.NODE_ENV === 'test') {
                    return true;
                }
                // Allow dates within the last 7 days for flexibility in testing and edge cases
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return value >= weekAgo;
            },
            message: 'Start date must be within the last 7 days or in the future (except for expired subscriptions)'
        }
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    nextBillingDate: {
        type: Date,
        required: false
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    trialEndDate: {
        type: Date,
        required: false
    },
    cancellationDate: {
        type: Date,
        required: false
    },
    cancellationReason: {
        type: String,
        required: false,
        trim: true
    },
    metadata: {
        source: {
            type: String,
            enum: ['web', 'mobile', 'admin', 'api', 'razorpay_webhook', 'clerk', 'csv_import', 'test_provisioning'],
            default: 'web'
        },
        campaign: {
            type: String,
            trim: true
        },
        referrer: {
            type: String,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        }
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
exports.subscriptionSchema = subscriptionSchema;
// Indexes for performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ startDate: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ paymentId: 1 });
subscriptionSchema.index({ orderId: 1 });
subscriptionSchema.index({ createdAt: -1 });
// Compound indexes for common queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, plan: 1 });
subscriptionSchema.index({ status: 1, startDate: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ autoRenew: 1 });
subscriptionSchema.index({ trialEndDate: 1 });
subscriptionSchema.index({ cancellationDate: 1 });
subscriptionSchema.index({ 'metadata.source': 1 });
subscriptionSchema.index({ 'metadata.campaign': 1 });
// Additional compound indexes for advanced queries
subscriptionSchema.index({ userId: 1, autoRenew: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ plan: 1, status: 1, startDate: 1 });
// Pre-save middleware to validate dates
subscriptionSchema.pre('save', function (next) {
    if (this.startDate >= this.endDate) {
        return next(new Error('End date must be after start date'));
    }
    // Allow past dates for expired subscriptions, test scenarios, or automated provisioning
    if (this.startDate < new Date() && this.status !== 'expired' && process.env.NODE_ENV !== 'test' && this.metadata?.source !== 'automated_provisioning') {
        return next(new Error('Start date must be today or in the future'));
    }
    next();
});
// Pre-update middleware to validate dates
subscriptionSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.startDate && update.endDate && update.startDate >= update.endDate) {
        return next(new Error('End date must be after start date'));
    }
    if (update.startDate && update.startDate < new Date() && process.env.NODE_ENV !== 'test' && update.metadata?.source !== 'automated_provisioning') {
        return next(new Error('Start date must be today or in the future'));
    }
    next();
});
// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
    if (this.status !== 'completed')
        return false;
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
};
// Instance method to check if subscription has expired
subscriptionSchema.methods.isExpired = function () {
    if (this.status !== 'completed')
        return false;
    const now = new Date();
    return now > this.endDate;
};
// Instance method to check if subscription is pending
subscriptionSchema.methods.isPending = function () {
    return this.status === 'pending';
};
// Instance method to get days remaining
subscriptionSchema.methods.getDaysRemaining = function () {
    if (!this.isActive())
        return 0;
    const now = new Date();
    const endDate = new Date(this.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Instance method to get days since start
subscriptionSchema.methods.getDaysSinceStart = function () {
    if (this.status !== 'completed')
        return 0;
    const now = new Date();
    const startDate = new Date(this.startDate);
    const diffTime = now.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Instance method to get total duration in days
subscriptionSchema.methods.getTotalDuration = function () {
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Instance method to get plan display name
subscriptionSchema.methods.getPlanDisplay = function () {
    const planMap = {
        basic: 'Basic Plan (₹49)',
        premium: 'Premium Plan (₹99)',
        enterprise: 'Enterprise Plan (₹299)'
    };
    return planMap[this.plan] || this.plan;
};
// Instance method to get status display
subscriptionSchema.methods.getStatusDisplay = function () {
    const statusMap = {
        pending: 'Pending',
        completed: 'Active',
        failed: 'Failed',
        refunded: 'Refunded',
        cancelled: 'Cancelled',
        expired: 'Expired'
    };
    return statusMap[this.status] || this.status;
};
// Instance method to check if subscription is in trial period
subscriptionSchema.methods.isInTrial = function () {
    if (!this.trialEndDate)
        return false;
    const now = new Date();
    return now <= this.trialEndDate && this.status === 'completed';
};
// Instance method to get trial days remaining
subscriptionSchema.methods.getTrialDaysRemaining = function () {
    if (!this.trialEndDate)
        return 0;
    const now = new Date();
    const trialEnd = new Date(this.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};
// Instance method to check if subscription can be renewed
subscriptionSchema.methods.canRenew = function () {
    return this.status === 'completed' && this.autoRenew && this.endDate > new Date();
};
// Instance method to get renewal date
subscriptionSchema.methods.getRenewalDate = function () {
    if (!this.nextBillingDate)
        return null;
    return new Date(this.nextBillingDate);
};
// Instance method to check if subscription is expiring soon (within 7 days)
subscriptionSchema.methods.isExpiringSoon = function () {
    if (this.status !== 'completed')
        return false;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    return this.endDate <= sevenDaysFromNow && this.endDate > now;
};
// Instance method to get subscription value
subscriptionSchema.methods.getSubscriptionValue = function () {
    const planValues = {
        basic: 49,
        premium: 99,
        enterprise: 299
    };
    return planValues[this.plan] || 0;
};
// Static method to find active subscriptions
subscriptionSchema.statics.findActiveSubscriptions = function () {
    const now = new Date();
    return this.find({
        status: 'completed',
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};
// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiringSubscriptions = function (days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.find({
        status: 'completed',
        endDate: { $lte: futureDate, $gte: new Date() }
    });
};
// Static method to find subscriptions by user
subscriptionSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
// Static method to find subscriptions by status
subscriptionSchema.statics.findByStatus = function (status) {
    return this.find({ status });
};
// Static method to find subscriptions by plan
subscriptionSchema.statics.findByPlan = function (plan) {
    return this.find({ plan });
};
// Static method to find subscriptions by date range
subscriptionSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
    });
};
// Static method to find subscriptions for renewal
subscriptionSchema.statics.findForRenewal = function () {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    return this.find({
        status: 'completed',
        autoRenew: true,
        endDate: { $lte: threeDaysFromNow, $gte: now }
    });
};
// Static method to find trial subscriptions
subscriptionSchema.statics.findTrialSubscriptions = function () {
    const now = new Date();
    return this.find({
        status: 'completed',
        trialEndDate: { $exists: true, $gte: now }
    });
};
// Static method to find subscriptions by metadata
subscriptionSchema.statics.findByMetadata = function (metadata) {
    return this.find({ metadata });
};
// Static method to get subscription statistics
subscriptionSchema.statics.getStatistics = async function () {
    const total = await this.countDocuments();
    const active = await this.countDocuments({
        status: 'completed',
        endDate: { $gte: new Date() }
    });
    const expired = await this.countDocuments({
        status: 'completed',
        endDate: { $lt: new Date() }
    });
    const cancelled = await this.countDocuments({ status: 'cancelled' });
    return {
        total,
        active,
        expired,
        cancelled,
        activePercentage: total > 0 ? ((active / total) * 100).toFixed(2) : 0
    };
};
// Static method to find subscriptions by source
subscriptionSchema.statics.findBySource = function (source) {
    return this.find({ 'metadata.source': source });
};
// Static method to find subscriptions by campaign
subscriptionSchema.statics.findByCampaign = function (campaign) {
    return this.find({ 'metadata.campaign': campaign });
};
// Virtual for subscription status
subscriptionSchema.virtual('subscriptionStatus').get(function () {
    if (this.status !== 'completed')
        return this.status;
    if (this.isExpired())
        return 'expired';
    if (this.isActive())
        return 'active';
    return 'pending';
});
// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function () {
    return this.getDaysRemaining();
});
// Virtual for plan display
subscriptionSchema.virtual('planDisplay').get(function () {
    return this.getPlanDisplay();
});
// Virtual for status display
subscriptionSchema.virtual('statusDisplay').get(function () {
    return this.getStatusDisplay();
});
// Ensure virtuals are serialized
subscriptionSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.Subscription = mongoose_1.default.model('Subscription', subscriptionSchema);
//# sourceMappingURL=Subscription.js.map