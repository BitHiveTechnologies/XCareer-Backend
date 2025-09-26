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
exports.UserProvisioningService = void 0;
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const UserProfile_1 = require("../models/UserProfile");
const logger_1 = require("../utils/logger");
/**
 * Comprehensive User Provisioning Service
 * Handles automated user creation, profile setup, and subscription management
 */
class UserProvisioningService {
    /**
     * Provision a new user with complete setup
     */
    static async provisionUser(data) {
        const result = {
            success: false,
            errors: [],
            warnings: []
        };
        try {
            // Step 1: Check if user already exists
            const existingUser = await User_1.User.findOne({ email: data.email });
            if (existingUser) {
                result.warnings?.push('User already exists, updating existing user');
                return await this.updateExistingUser(existingUser, data);
            }
            // Step 2: Create new user
            const user = await this.createUser(data);
            if (!user) {
                result.errors?.push('Failed to create user');
                return result;
            }
            result.user = user;
            // Step 3: Create user profile
            if (data.profileData) {
                const profile = await this.createUserProfile(user._id, data.profileData, user.email, user.mobile);
                if (profile) {
                    result.profile = profile;
                }
                else {
                    result.warnings?.push('Failed to create user profile');
                }
            }
            // Step 4: Create subscription if provided
            if (data.subscriptionPlan && data.subscriptionStatus === 'active') {
                const subscription = await this.createSubscription(user._id, {
                    plan: data.subscriptionPlan,
                    status: 'completed',
                    metadata: data.metadata
                });
                if (subscription) {
                    result.subscription = subscription;
                }
                else {
                    result.warnings?.push('Failed to create subscription');
                }
            }
            // Step 5: Trigger welcome email (if email service is configured)
            await this.triggerWelcomeEmail(user, data);
            result.success = true;
            logger_1.logger.info('User provisioned successfully', {
                userId: user._id,
                email: user.email,
                plan: data.subscriptionPlan,
                source: data.metadata?.source
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('User provisioning failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: data.email,
                data
            });
            result.errors?.push(error instanceof Error ? error.message : 'Unknown error');
            return result;
        }
    }
    /**
     * Create a new user
     */
    static async createUser(data) {
        try {
            const userData = {
                email: data.email,
                name: data.name,
                mobile: data.mobile || '9876543210', // Default mobile if not provided
                role: 'user',
                subscriptionPlan: data.subscriptionPlan || 'basic',
                subscriptionStatus: data.subscriptionStatus || 'inactive'
            };
            // Add Clerk user ID if provided, otherwise add a default password
            if (data.clerkUserId) {
                userData.clerkUserId = data.clerkUserId;
            }
            else {
                // Generate a temporary password for the user
                userData.password = 'TempPassword123!';
            }
            const user = new User_1.User(userData);
            await user.save();
            logger_1.logger.info('User created successfully', {
                userId: user._id,
                email: user.email,
                clerkUserId: data.clerkUserId
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('User creation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: data.email
            });
            throw error;
        }
    }
    /**
     * Create user profile
     */
    static async createUserProfile(userId, profileData, userEmail, userMobile) {
        try {
            const profile = new UserProfile_1.UserProfile({
                userId,
                firstName: profileData.firstName || 'User',
                lastName: profileData.lastName || '',
                email: userEmail,
                contactNumber: userMobile,
                dateOfBirth: profileData.dateOfBirth || new Date('1995-01-01'),
                qualification: profileData.qualification || 'B.Tech',
                stream: profileData.stream || 'CSE',
                yearOfPassout: profileData.yearOfPassout || new Date().getFullYear(),
                cgpaOrPercentage: profileData.cgpaOrPercentage || 7.0,
                collegeName: profileData.collegeName || 'Not specified'
            });
            await profile.save();
            logger_1.logger.info('User profile created successfully', {
                userId,
                profileId: profile._id
            });
            return profile;
        }
        catch (error) {
            logger_1.logger.error('User profile creation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId
            });
            throw error;
        }
    }
    /**
     * Create subscription
     */
    static async createSubscription(userId, subscriptionData) {
        try {
            const now = new Date();
            let endDate;
            // Calculate end date based on plan
            switch (subscriptionData.plan) {
                case 'basic':
                    endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
                    break;
                case 'premium':
                    endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
                    break;
                case 'enterprise':
                    endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
                    break;
                default:
                    endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
            }
            // Set start date to be slightly in the future to avoid validation issues
            const startDate = new Date(now.getTime() + 1000); // 1 second in the future
            const subscription = new Subscription_1.Subscription({
                userId,
                plan: subscriptionData.plan,
                amount: this.getPlanAmount(subscriptionData.plan),
                paymentId: `provisioned_${Date.now()}`,
                orderId: `order_${Date.now()}`,
                status: subscriptionData.status || 'completed',
                startDate,
                endDate,
                metadata: subscriptionData.metadata || {
                    source: 'automated_provisioning',
                    campaign: 'system_generated'
                }
            });
            await subscription.save();
            // Update user subscription status
            await User_1.User.findByIdAndUpdate(userId, {
                subscriptionPlan: subscriptionData.plan,
                subscriptionStatus: 'active',
                subscriptionStartDate: startDate,
                subscriptionEndDate: endDate
            });
            logger_1.logger.info('Subscription created successfully', {
                userId,
                subscriptionId: subscription._id,
                plan: subscriptionData.plan
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Subscription creation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId
            });
            throw error;
        }
    }
    /**
     * Update existing user
     */
    static async updateExistingUser(user, data) {
        const result = {
            success: false,
            errors: [],
            warnings: []
        };
        try {
            // Update user fields if provided
            const updateData = {};
            if (data.name && data.name !== user.name)
                updateData.name = data.name;
            if (data.mobile && data.mobile !== user.mobile)
                updateData.mobile = data.mobile;
            if (data.subscriptionPlan && data.subscriptionPlan !== user.subscriptionPlan) {
                updateData.subscriptionPlan = data.subscriptionPlan;
            }
            if (data.subscriptionStatus && data.subscriptionStatus !== user.subscriptionStatus) {
                updateData.subscriptionStatus = data.subscriptionStatus;
            }
            if (Object.keys(updateData).length > 0) {
                await User_1.User.findByIdAndUpdate(user._id, updateData);
                result.warnings?.push('User updated with new information');
            }
            // Update or create profile if provided
            if (data.profileData) {
                const existingProfile = await UserProfile_1.UserProfile.findOne({ userId: user._id });
                if (existingProfile) {
                    // Update existing profile
                    const profileUpdateData = {};
                    if (data.profileData.firstName)
                        profileUpdateData.firstName = data.profileData.firstName;
                    if (data.profileData.lastName)
                        profileUpdateData.lastName = data.profileData.lastName;
                    if (data.profileData.qualification)
                        profileUpdateData.qualification = data.profileData.qualification;
                    if (data.profileData.stream)
                        profileUpdateData.stream = data.profileData.stream;
                    if (data.profileData.yearOfPassout)
                        profileUpdateData.yearOfPassout = data.profileData.yearOfPassout;
                    if (data.profileData.cgpaOrPercentage)
                        profileUpdateData.cgpaOrPercentage = data.profileData.cgpaOrPercentage;
                    if (data.profileData.collegeName)
                        profileUpdateData.collegeName = data.profileData.collegeName;
                    if (Object.keys(profileUpdateData).length > 0) {
                        await UserProfile_1.UserProfile.findByIdAndUpdate(existingProfile._id, profileUpdateData);
                        result.warnings?.push('User profile updated');
                    }
                }
                else {
                    // Create new profile
                    const profile = await this.createUserProfile(user._id, data.profileData, user.email, user.mobile);
                    if (profile) {
                        result.profile = profile;
                        result.warnings?.push('New user profile created');
                    }
                }
            }
            // Create subscription if provided and user doesn't have active subscription
            if (data.subscriptionPlan && data.subscriptionStatus === 'active') {
                const existingSubscription = await Subscription_1.Subscription.findOne({
                    userId: user._id,
                    status: { $in: ['completed', 'active'] }
                });
                if (!existingSubscription) {
                    const subscription = await this.createSubscription(user._id, {
                        plan: data.subscriptionPlan,
                        status: 'completed',
                        metadata: data.metadata
                    });
                    if (subscription) {
                        result.subscription = subscription;
                        result.warnings?.push('New subscription created');
                    }
                }
                else {
                    result.warnings?.push('User already has active subscription');
                }
            }
            result.user = user;
            result.success = true;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Update existing user failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: user._id
            });
            result.errors?.push(error instanceof Error ? error.message : 'Unknown error');
            return result;
        }
    }
    /**
     * Trigger welcome email
     */
    static async triggerWelcomeEmail(user, data) {
        try {
            const { emailService } = await Promise.resolve().then(() => __importStar(require('../utils/emailService')));
            logger_1.logger.info('Welcome email triggered', {
                userId: user._id,
                email: user.email,
                plan: data.subscriptionPlan,
                source: data.metadata?.source
            });
            // Send welcome email with enhanced template
            const emailSent = await emailService.sendWelcomeEmail(user.email, user.name, data.subscriptionPlan, data.metadata?.source);
            if (emailSent) {
                logger_1.logger.info('Welcome email sent successfully', {
                    userId: user._id,
                    email: user.email,
                    plan: data.subscriptionPlan
                });
            }
            else {
                logger_1.logger.warn('Welcome email failed to send', {
                    userId: user._id,
                    email: user.email
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Welcome email trigger failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: user._id
            });
        }
    }
    /**
     * Get plan amount
     */
    static getPlanAmount(plan) {
        switch (plan) {
            case 'basic': return 49;
            case 'premium': return 99;
            case 'enterprise': return 299;
            default: return 49;
        }
    }
    /**
     * Get plan features
     */
    static getPlanFeatures(plan) {
        switch (plan) {
            case 'basic':
                return ['Basic job alerts', 'Profile creation', 'Resume templates'];
            case 'premium':
                return ['Advanced job alerts', 'Priority support', 'All resume templates', 'Job matching'];
            case 'enterprise':
                return ['All premium features', 'Custom integrations', 'Dedicated support', 'Analytics dashboard'];
            default:
                return ['Basic features'];
        }
    }
    /**
     * Provision user from payment webhook
     */
    static async provisionFromPaymentWebhook(paymentData) {
        try {
            const userData = {
                email: paymentData.customer?.email || paymentData.email,
                name: paymentData.customer?.name || 'User',
                mobile: paymentData.customer?.contact || '0000000000',
                subscriptionPlan: this.determinePlanFromAmount(paymentData.amount),
                subscriptionStatus: 'active',
                metadata: {
                    source: 'payment_webhook',
                    campaign: 'razorpay_payment',
                    notes: `Payment ID: ${paymentData.payment_id}`
                }
            };
            return await this.provisionUser(userData);
        }
        catch (error) {
            logger_1.logger.error('Payment webhook provisioning failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                paymentData
            });
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Determine plan from payment amount
     */
    static determinePlanFromAmount(amount) {
        const amountInRupees = amount / 100; // Convert from paise to rupees
        if (amountInRupees >= 299)
            return 'enterprise';
        if (amountInRupees >= 99)
            return 'premium';
        return 'basic';
    }
    /**
     * Bulk provision users
     */
    static async bulkProvisionUsers(usersData) {
        const results = [];
        for (const userData of usersData) {
            try {
                const result = await this.provisionUser(userData);
                results.push(result);
            }
            catch (error) {
                results.push({
                    success: false,
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                });
            }
        }
        logger_1.logger.info('Bulk user provisioning completed', {
            total: usersData.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
        return results;
    }
    /**
     * Get provisioning statistics
     */
    static async getProvisioningStats() {
        try {
            const totalUsers = await User_1.User.countDocuments();
            const activeSubscriptions = await Subscription_1.Subscription.countDocuments({ status: 'completed' });
            const usersWithProfiles = await UserProfile_1.UserProfile.countDocuments();
            const recentProvisioned = await User_1.User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            });
            return {
                totalUsers,
                activeSubscriptions,
                usersWithProfiles,
                recentProvisioned,
                profileCompletionRate: totalUsers > 0 ? (usersWithProfiles / totalUsers) * 100 : 0,
                subscriptionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0
            };
        }
        catch (error) {
            logger_1.logger.error('Get provisioning stats failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.UserProvisioningService = UserProvisioningService;
//# sourceMappingURL=userProvisioningService.js.map