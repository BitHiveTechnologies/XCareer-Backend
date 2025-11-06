import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { logger } from '../utils/logger';

export interface UserProvisioningData {
  email: string;
  clerkUserId?: string;
  subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  profileData?: {
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    qualification?: string;
    stream?: string;
    yearOfPassout?: number;
    cgpaOrPercentage?: number;
    collegeName?: string;
    dateOfBirth?: Date;
  };
  metadata?: {
    source?: string;
    campaign?: string;
    referrer?: string;
    notes?: string;
  };
}

export interface ProvisioningResult {
  success: boolean;
  user?: any;
  profile?: any;
  subscription?: any;
  errors?: string[];
  warnings?: string[];
}

/**
 * Comprehensive User Provisioning Service
 * Handles automated user creation, profile setup, and subscription management
 */
export class UserProvisioningService {
  /**
   * Provision a new user with complete setup
   */
  static async provisionUser(data: UserProvisioningData): Promise<ProvisioningResult> {
    const result: ProvisioningResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
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
        const profile = await this.createUserProfile(user._id, data.profileData, user.email);
        if (profile) {
          result.profile = profile;
        } else {
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
        } else {
          result.warnings?.push('Failed to create subscription');
        }
      }

      // Step 5: Trigger welcome email (if email service is configured)
      await this.triggerWelcomeEmail(user, data);

      result.success = true;
      logger.info('User provisioned successfully', {
        userId: user._id,
        email: user.email,
        plan: data.subscriptionPlan,
        source: data.metadata?.source
      });

      return result;
    } catch (error) {
      logger.error('User provisioning failed', {
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
  private static async createUser(data: UserProvisioningData): Promise<any> {
    try {
      const userData: any = {
        email: data.email,
        role: 'user',
        subscriptionPlan: data.subscriptionPlan || 'basic',
        subscriptionStatus: data.subscriptionStatus || 'inactive'
      };

      // Add Clerk user ID if provided, otherwise add a default password
      if (data.clerkUserId) {
        userData.clerkUserId = data.clerkUserId;
      } else {
        // Generate a temporary password for the user
        userData.password = 'TempPassword123!';
      }

      const user = new User(userData);
      await user.save();

      logger.info('User created successfully', {
        userId: user._id,
        email: user.email,
        clerkUserId: data.clerkUserId
      });

      return user;
    } catch (error) {
      logger.error('User creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email
      });
      throw error;
    }
  }

  /**
   * Create user profile
   */
  private static async createUserProfile(userId: string, profileData: any, userEmail: string): Promise<any> {
    try {
      const profile = new UserProfile({
        userId,
        firstName: profileData.firstName || 'User',
        lastName: profileData.lastName || '',
        fullName: `${profileData.firstName || 'User'} ${profileData.lastName || ''}`.trim(),
        contactNumber: profileData.contactNumber || '9876543210',
        dateOfBirth: profileData.dateOfBirth || new Date('1995-01-01'),
        qualification: profileData.qualification || 'Not specified',
        stream: profileData.stream || 'CSE',
        yearOfPassout: profileData.yearOfPassout || new Date().getFullYear(),
        cgpaOrPercentage: profileData.cgpaOrPercentage || 7.0,
        collegeName: profileData.collegeName || 'Not specified'
      });

      await profile.save();

      logger.info('User profile created successfully', {
        userId,
        profileId: profile._id
      });

      return profile;
    } catch (error) {
      logger.error('User profile creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Create subscription
   */
  private static async createSubscription(userId: string, subscriptionData: any): Promise<any> {
    try {
      const now = new Date();
      let endDate: Date;

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
      
      const subscription = new Subscription({
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
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: subscriptionData.plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate
      });

      logger.info('Subscription created successfully', {
        userId,
        subscriptionId: subscription._id,
        plan: subscriptionData.plan
      });

      return subscription;
    } catch (error) {
      logger.error('Subscription creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Update existing user
   */
  private static async updateExistingUser(user: any, data: UserProvisioningData): Promise<ProvisioningResult> {
    const result: ProvisioningResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Update user fields if provided
      const updateData: any = {};
      if (data.subscriptionPlan && data.subscriptionPlan !== user.subscriptionPlan) {
        updateData.subscriptionPlan = data.subscriptionPlan;
      }
      if (data.subscriptionStatus && data.subscriptionStatus !== user.subscriptionStatus) {
        updateData.subscriptionStatus = data.subscriptionStatus;
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(user._id, updateData);
        result.warnings?.push('User updated with new information');
      }

      // Update or create profile if provided
      if (data.profileData) {
        const existingProfile = await UserProfile.findOne({ userId: user._id });
        if (existingProfile) {
          // Update existing profile
          const profileUpdateData: any = {};
          if (data.profileData.firstName) profileUpdateData.firstName = data.profileData.firstName;
          if (data.profileData.lastName) profileUpdateData.lastName = data.profileData.lastName;
          if (data.profileData.qualification) profileUpdateData.qualification = data.profileData.qualification;
          if (data.profileData.stream) profileUpdateData.stream = data.profileData.stream;
          if (data.profileData.yearOfPassout) profileUpdateData.yearOfPassout = data.profileData.yearOfPassout;
          if (data.profileData.cgpaOrPercentage) profileUpdateData.cgpaOrPercentage = data.profileData.cgpaOrPercentage;
          if (data.profileData.collegeName) profileUpdateData.collegeName = data.profileData.collegeName;

          if (Object.keys(profileUpdateData).length > 0) {
            await UserProfile.findByIdAndUpdate(existingProfile._id, profileUpdateData);
            result.warnings?.push('User profile updated');
          }
        } else {
          // Create new profile
          const profile = await this.createUserProfile(user._id, data.profileData, user.email);
          if (profile) {
            result.profile = profile;
            result.warnings?.push('New user profile created');
          }
        }
      }

      // Create subscription if provided and user doesn't have active subscription
      if (data.subscriptionPlan && data.subscriptionStatus === 'active') {
        const existingSubscription = await Subscription.findOne({ 
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
        } else {
          result.warnings?.push('User already has active subscription');
        }
      }

      result.user = user;
      result.success = true;
      return result;
    } catch (error) {
      logger.error('Update existing user failed', {
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
  private static async triggerWelcomeEmail(user: any, data: UserProvisioningData): Promise<void> {
    try {
      const { emailService } = await import('../utils/emailService');
      
      logger.info('Welcome email triggered', {
        userId: user._id,
        email: user.email,
        plan: data.subscriptionPlan,
        source: data.metadata?.source
      });

      // Send welcome email with enhanced template
      const emailSent = await emailService.sendWelcomeEmail(
        user.email,
        user.name,
        data.subscriptionPlan,
        data.metadata?.source
      );

      if (emailSent) {
        logger.info('Welcome email sent successfully', {
          userId: user._id,
          email: user.email,
          plan: data.subscriptionPlan
        });
      } else {
        logger.warn('Welcome email failed to send', {
          userId: user._id,
          email: user.email
        });
      }
    } catch (error) {
      logger.error('Welcome email trigger failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user._id
      });
    }
  }

  /**
   * Get plan amount
   */
  private static getPlanAmount(plan: string): number {
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
  private static getPlanFeatures(plan: string): string[] {
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
  static async provisionFromPaymentWebhook(paymentData: any): Promise<ProvisioningResult> {
    try {
      const userData: UserProvisioningData = {
        email: paymentData.customer?.email || paymentData.email,
        subscriptionPlan: this.determinePlanFromAmount(paymentData.amount),
        subscriptionStatus: 'active',
        profileData: {
          firstName: paymentData.customer?.name?.split(' ')[0] || 'User',
          lastName: paymentData.customer?.name?.split(' ').slice(1).join(' ') || '',
          contactNumber: paymentData.customer?.contact || '0000000000'
        },
        metadata: {
          source: 'payment_webhook',
          campaign: 'razorpay_payment',
          notes: `Payment ID: ${paymentData.payment_id}`
        }
      };

      return await this.provisionUser(userData);
    } catch (error) {
      logger.error('Payment webhook provisioning failed', {
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
  private static determinePlanFromAmount(amount: number): 'basic' | 'premium' | 'enterprise' {
    const amountInRupees = amount / 100; // Convert from paise to rupees
    
    if (amountInRupees >= 299) return 'enterprise';
    if (amountInRupees >= 99) return 'premium';
    return 'basic';
  }

  /**
   * Bulk provision users
   */
  static async bulkProvisionUsers(usersData: UserProvisioningData[]): Promise<ProvisioningResult[]> {
    const results: ProvisioningResult[] = [];

    for (const userData of usersData) {
      try {
        const result = await this.provisionUser(userData);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    logger.info('Bulk user provisioning completed', {
      total: usersData.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Get provisioning statistics
   */
  static async getProvisioningStats(): Promise<any> {
    try {
      const totalUsers = await User.countDocuments();
      const activeSubscriptions = await Subscription.countDocuments({ status: 'completed' });
      const usersWithProfiles = await UserProfile.countDocuments();
      const recentProvisioned = await User.countDocuments({
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
    } catch (error) {
      logger.error('Get provisioning stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
