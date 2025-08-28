import { Request, Response } from 'express';
import { Webhook } from 'svix';
// Note: headers import removed as it's not needed for webhook verification
import { clerkConfig } from '../../config/clerk';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';

export interface ClerkWebhookPayload {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
      verification: {
        status: string;
      };
    }>;
    first_name?: string;
    last_name?: string;
    public_metadata?: Record<string, any>;
    private_metadata?: Record<string, any>;
    created_at: number;
    updated_at: number;
  };
  object: string;
  type: string;
}

/**
 * Handle Clerk webhook events
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Missing webhook headers'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify webhook signature
    const webhook = new Webhook(clerkConfig.webhookSecret);
    let payload: ClerkWebhookPayload;

    try {
      payload = webhook.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookPayload;
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        svix_id,
        svix_timestamp
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid webhook signature'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { type, data } = payload;
    const clerkUserId = data.id;
    const primaryEmail = data.email_addresses.find(email => email.verification.status === 'verified')?.email_address;

    if (!primaryEmail) {
      logger.warn('No verified email found for user', { clerkUserId });
      res.status(400).json({
        success: false,
        error: {
          message: 'No verified email found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('Processing webhook event', {
      type,
      clerkUserId,
      email: primaryEmail
    });

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(clerkUserId);
        break;
      default:
        logger.info('Unhandled webhook event type', { type });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Webhook processed successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Webhook processing failed'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle user creation event
 */
const handleUserCreated = async (data: ClerkWebhookPayload['data']): Promise<void> => {
  try {
    const clerkUserId = data.id;
    const primaryEmail = data.email_addresses.find(email => email.verification.status === 'verified')?.email_address;

    if (!primaryEmail) {
      logger.warn('No verified email for user creation', { clerkUserId });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkUserId });
    if (existingUser) {
      logger.info('User already exists, skipping creation', { clerkUserId });
      return;
    }

    // Create user in local database
    const user = new User({
      clerkUserId,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown User',
      email: primaryEmail,
      mobile: '', // Will be updated when user completes profile
      subscriptionPlan: 'basic',
      subscriptionStatus: 'inactive',
      role: data.public_metadata?.role || 'user'
    });

    await user.save();

    // Create user profile
    const userProfile = new UserProfile({
      userId: user._id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: primaryEmail,
      contactNumber: '',
      dateOfBirth: new Date(),
      qualification: '',
      stream: '',
      yearOfPassout: new Date().getFullYear(),
      cgpaOrPercentage: 0,
      collegeName: 'Not specified'
    });

    await userProfile.save();

    logger.info('User created successfully from webhook', {
      clerkUserId,
      localUserId: user._id,
      email: primaryEmail
    });
  } catch (error) {
    logger.error('Failed to create user from webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId: data.id
    });
  }
};

/**
 * Handle user update event
 */
const handleUserUpdated = async (data: ClerkWebhookPayload['data']): Promise<void> => {
  try {
    const clerkUserId = data.id;
    const primaryEmail = data.email_addresses.find(email => email.verification.status === 'verified')?.email_address;

    if (!primaryEmail) {
      logger.warn('No verified email for user update', { clerkUserId });
      return;
    }

    // Find and update user
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      logger.warn('User not found for update', { clerkUserId });
      return;
    }

    // Update user fields
    user.name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown User';
    user.email = primaryEmail;
    user.role = data.public_metadata?.role || 'user';
    user.updatedAt = new Date();

    await user.save();

    // Update user profile
    const userProfile = await UserProfile.findOne({ userId: user._id });
    if (userProfile) {
      userProfile.firstName = data.first_name || '';
      userProfile.lastName = data.last_name || '';
      userProfile.email = primaryEmail;
      userProfile.updatedAt = new Date();
      await userProfile.save();
    }

    logger.info('User updated successfully from webhook', {
      clerkUserId,
      localUserId: user._id,
      email: primaryEmail
    });
  } catch (error) {
    logger.error('Failed to update user from webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId: data.id
    });
  }
};

/**
 * Handle user deletion event
 */
const handleUserDeleted = async (clerkUserId: string): Promise<void> => {
  try {
    // Find and delete user
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      logger.warn('User not found for deletion', { clerkUserId });
      return;
    }

    // Delete user profile
    await UserProfile.deleteOne({ userId: user._id });

    // Delete user
    await User.deleteOne({ _id: user._id });

    logger.info('User deleted successfully from webhook', {
      clerkUserId,
      localUserId: user._id
    });
  } catch (error) {
    logger.error('Failed to delete user from webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId
    });
  }
};
