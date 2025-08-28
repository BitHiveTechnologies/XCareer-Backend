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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const environment_1 = require("../config/environment");
// User schema
const userSchema = new mongoose_1.Schema({
    clerkUserId: {
        type: String,
        unique: true,
        sparse: true, // Allow multiple null values
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function () {
            // Password is required only if not using Clerk
            return !this.clerkUserId;
        },
        minlength: [8, 'Password must be at least 8 characters long']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'super_admin'],
            message: 'Role must be user, admin, or super_admin'
        },
        default: 'user'
    },
    subscriptionPlan: {
        type: String,
        enum: {
            values: ['basic', 'premium'],
            message: 'Subscription plan must be either basic or premium'
        },
        default: 'basic'
    },
    subscriptionStatus: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'expired'],
            message: 'Subscription status must be active, inactive, or expired'
        },
        default: 'inactive'
    },
    subscriptionStartDate: {
        type: Date,
        default: null
    },
    subscriptionEndDate: {
        type: Date,
        default: null
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});
exports.userSchema = userSchema;
// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ clerkUserId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ subscriptionEndDate: 1 });
userSchema.index({ isProfileComplete: 1 });
userSchema.index({ createdAt: -1 });
// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new) and exists
    if (!this.isModified('password') || !this.password)
        return next();
    try {
        // Hash password with configured rounds
        const salt = await bcryptjs_1.default.genSalt(environment_1.config.BCRYPT_ROUNDS);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Pre-update middleware to hash password on updates
userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(environment_1.config.BCRYPT_ROUNDS);
            update.password = await bcryptjs_1.default.hash(update.password, salt);
        }
        catch (error) {
            next(error);
        }
    }
    next();
});
// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        // If no password stored (Clerk user), return false
        if (!this.password)
            return false;
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
// Instance method to check if subscription is active
userSchema.methods.isSubscriptionActive = function () {
    if (this.subscriptionStatus !== 'active')
        return false;
    if (!this.subscriptionEndDate)
        return false;
    return new Date() < this.subscriptionEndDate;
};
// Instance method to get subscription days remaining
userSchema.methods.getSubscriptionDaysRemaining = function () {
    if (!this.isSubscriptionActive())
        return 0;
    const now = new Date();
    const endDate = new Date(this.subscriptionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// Static method to find users by subscription status
userSchema.statics.findBySubscriptionStatus = function (status) {
    return this.find({ subscriptionStatus: status });
};
// Static method to find users with expiring subscriptions
userSchema.statics.findExpiringSubscriptions = function (days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.find({
        subscriptionStatus: 'active',
        subscriptionEndDate: { $lte: futureDate }
    });
};
// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return this.name;
});
// Virtual for subscription status with expiry info
userSchema.virtual('subscriptionInfo').get(function () {
    return {
        status: this.subscriptionStatus,
        plan: this.subscriptionPlan,
        isActive: this.isSubscriptionActive(),
        daysRemaining: this.getSubscriptionDaysRemaining(),
        startDate: this.subscriptionStartDate,
        endDate: this.subscriptionEndDate
    };
});
// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
// Create and export the model
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map