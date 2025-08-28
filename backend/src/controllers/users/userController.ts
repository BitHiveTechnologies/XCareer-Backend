import { Request, Response } from 'express';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { logger } from '../../utils/logger';

// Extend Request to include user from Clerk middleware
interface AuthenticatedRequest extends Request {
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
 * Get current authenticated user's profile
 */
export const getCurrentUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.user?.clerkUserId;

    if (!clerkUserId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by Clerk ID
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

    // Find user profile
    const profile = await UserProfile.findOne({ userId: user._id });
    
    // Combine user and profile data
    const userData = {
      id: user._id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: profile || null
    };

    logger.info('Current user profile retrieved', {
      userId: user._id,
      clerkUserId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: userData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get current user profile failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId: req.user?.clerkUserId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get current user profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update current authenticated user's profile
 */
export const updateCurrentUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.user?.clerkUserId;
    const updateData = req.body;

    if (!clerkUserId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by Clerk ID
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

    // Update basic user info if provided
    if (updateData.name || updateData.mobile) {
      const userUpdates: any = {};
      if (updateData.name) userUpdates.name = updateData.name;
      if (updateData.mobile) userUpdates.mobile = updateData.mobile;
      
      await User.findByIdAndUpdate(user._id, userUpdates);
    }

    // Update or create user profile
    let profile = await UserProfile.findOne({ userId: user._id });
    if (profile) {
      // Update existing profile
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      // Create new profile
      profile = new UserProfile({
        userId: user._id,
        firstName: req.user?.firstName || '',
        lastName: req.user?.lastName || '',
        email: user.email,
        contactNumber: updateData.mobile || '',
        dateOfBirth: updateData.dateOfBirth || new Date(),
        qualification: updateData.qualification || '',
        stream: updateData.stream || '',
        yearOfPassout: updateData.yearOfPassout || new Date().getFullYear(),
        cgpaOrPercentage: updateData.cgpaOrPercentage || 0,
        collegeName: updateData.collegeName || 'Not specified'
      });
      await profile.save();
    }

    // Update user's profile completion status
    const isComplete = await (profile as any).isProfileComplete();
    await User.findByIdAndUpdate(user._id, { isProfileComplete: isComplete });

    // Get updated user data
    const updatedUser = await User.findById(user._id).select('-password');
    const updatedProfile = await UserProfile.findOne({ userId: user._id });

    logger.info('Current user profile updated', {
      userId: user._id,
      clerkUserId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser?._id,
          clerkUserId: updatedUser?.clerkUserId,
          email: updatedUser?.email,
          name: updatedUser?.name,
          mobile: updatedUser?.mobile,
          role: updatedUser?.role,
          subscriptionPlan: updatedUser?.subscriptionPlan,
          subscriptionStatus: updatedUser?.subscriptionStatus,
          isProfileComplete: updatedUser?.isProfileComplete,
          profile: updatedProfile
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update current user profile failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId: req.user?.clerkUserId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update current user profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get profile completion status for current user
 */
export const getProfileCompletionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.user?.clerkUserId;

    if (!clerkUserId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by Clerk ID
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

    // Find user profile
    const profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      res.status(200).json({
        success: true,
        data: {
          completionPercentage: 0,
          isComplete: false,
          missingFields: ['qualification', 'stream', 'yearOfPassout', 'cgpaOrPercentage', 'collegeName'],
          totalFields: 5,
          completedFields: 0
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate completion percentage
    const requiredFields = ['qualification', 'stream', 'yearOfPassout', 'cgpaOrPercentage', 'collegeName'];
    const completedFields = requiredFields.filter(field => {
      const value = (profile as any)[field];
      return value && value !== '' && value !== 0 && value !== 'Not specified';
    });

    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    const isComplete = completionPercentage === 100;

    logger.info('Profile completion status retrieved', {
      userId: user._id,
      clerkUserId,
      completionPercentage,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        isComplete,
        missingFields: requiredFields.filter(field => !completedFields.includes(field)),
        totalFields: requiredFields.length,
        completedFields: completedFields.length,
        profile: {
          qualification: profile.qualification,
          stream: profile.stream,
          yearOfPassout: profile.yearOfPassout,
          cgpaOrPercentage: profile.cgpaOrPercentage,
          collegeName: profile.collegeName
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get profile completion status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clerkUserId: req.user?.clerkUserId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile completion status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Find user with profile
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user profile
    const profile = await UserProfile.findOne({ userId });
    
    // Combine user and profile data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: profile || null
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user profile failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update basic user info if provided
    if (updateData.name || updateData.mobile) {
      const userUpdates: any = {};
      if (updateData.name) userUpdates.name = updateData.name;
      if (updateData.mobile) userUpdates.mobile = updateData.mobile;
      
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    // Update or create user profile
    let profile = await UserProfile.findOne({ userId });
    if (profile) {
      // Update existing profile
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      // Create new profile
      profile = new UserProfile({
        userId,
        ...updateData
      });
      await profile.save();
    }

    // Update user's profile completion status
    const isComplete = await (profile as any).isProfileComplete();
    await User.findByIdAndUpdate(userId, { isProfileComplete: isComplete });

    // Get updated user data
    const updatedUser = await User.findById(userId).select('-password');
    const updatedProfile = await UserProfile.findOne({ userId });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser?._id,
          email: updatedUser?.email,
          name: updatedUser?.name,
          mobile: updatedUser?.mobile,
          subscriptionPlan: updatedUser?.subscriptionPlan,
          subscriptionStatus: updatedUser?.subscriptionStatus,
          isProfileComplete: updatedUser?.isProfileComplete,
          profile: updatedProfile
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update user profile failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, status, subscriptionPlan } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.subscriptionStatus = status;
    }
    
    if (subscriptionPlan) {
      query.subscriptionPlan = subscriptionPlan;
    }

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all users failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get users'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Delete user profile first
    await UserProfile.findOneAndDelete({ userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);

    logger.info('User deleted successfully', {
      userId,
      email: user.email,
      adminId: req.user?.id || 'unknown',
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete user failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user statistics (admin only)
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({ subscriptionStatus: 'active' });
    const completedProfiles = await User.countDocuments({ isProfileComplete: true });
    
    // Get subscription plan distribution
    const planStats = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionPlan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        completedProfiles,
        planStats,
        recentRegistrations,
        profileCompletionRate: totalUsers > 0 ? (completedProfiles / totalUsers * 100).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};
