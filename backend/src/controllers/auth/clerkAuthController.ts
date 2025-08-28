import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { createClerkClient } from '@clerk/backend';
import { clerkConfig } from '../../config/clerk';

export interface ClerkAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
    clerkUserId: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (req: ClerkAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const clerkUserId = req.user?.clerkUserId;

    if (!userId || !clerkUserId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user from local database
    const user = await User.findOne({ clerkUserId }).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found in local database'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId: user._id });

    // Get latest data from Clerk
    const clerk = createClerkClient({ secretKey: clerkConfig.secretKey });
    const clerkUser = await clerk.users.getUser(clerkUserId);

    logger.info('Current user profile retrieved', {
      userId,
      clerkUserId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          clerkUserId: user.clerkUserId,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionPlan: user.subscriptionPlan,
          isProfileComplete: user.isProfileComplete
        },
        profile: userProfile ? {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          contactNumber: userProfile.contactNumber,
          dateOfBirth: userProfile.dateOfBirth,
          qualification: userProfile.qualification,
          stream: userProfile.stream,
          yearOfPassout: userProfile.yearOfPassout,
          cgpaOrPercentage: userProfile.cgpaOrPercentage,
          collegeName: userProfile.collegeName
        } : null,
        clerk: {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          emailAddresses: clerkUser.emailAddresses,
          publicMetadata: clerkUser.publicMetadata,
          createdAt: clerkUser.createdAt,
          updatedAt: clerkUser.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get current user failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get current user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (req: ClerkAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const clerkUserId = req.user?.clerkUserId;
    const { mobile, qualification, stream, yearOfPassout, cgpaOrPercentage, collegeName } = req.body;

    if (!userId || !clerkUserId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user from local database
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found in local database'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update user mobile if provided
    if (mobile) {
      user.mobile = mobile;
    }

    // Update user profile
    let userProfile = await UserProfile.findOne({ userId: user._id });
    
    if (!userProfile) {
      // Create new profile if it doesn't exist
      userProfile = new UserProfile({
        userId: user._id,
        firstName: req.user?.firstName || '',
        lastName: req.user?.lastName || '',
        email: user.email,
        contactNumber: mobile || '',
        dateOfBirth: new Date(),
        qualification: qualification || '',
        stream: stream || '',
        yearOfPassout: yearOfPassout || new Date().getFullYear(),
        cgpaOrPercentage: cgpaOrPercentage || 0,
        collegeName: collegeName || 'Not specified'
      });
    } else {
      // Update existing profile
      if (mobile) userProfile.contactNumber = mobile;
      if (qualification) userProfile.qualification = qualification;
      if (stream) userProfile.stream = stream;
      if (yearOfPassout) userProfile.yearOfPassout = yearOfPassout;
      if (cgpaOrPercentage !== undefined) userProfile.cgpaOrPercentage = cgpaOrPercentage;
      if (collegeName) userProfile.collegeName = collegeName;
    }

    // Save both user and profile
    await Promise.all([user.save(), userProfile.save()]);

    // Mark profile as complete
    user.isProfileComplete = true;
    await user.save();

    logger.info('User profile updated successfully', {
      userId,
      clerkUserId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isProfileComplete: user.isProfileComplete
        },
        profile: {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          contactNumber: userProfile.contactNumber,
          qualification: userProfile.qualification,
          stream: userProfile.stream,
          yearOfPassout: userProfile.yearOfPassout,
          cgpaOrPercentage: userProfile.cgpaOrPercentage,
          collegeName: userProfile.collegeName
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Profile update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};
