import { Request, Response } from 'express';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { Subscription } from '../../models/Subscription';
import { logger } from '../../utils/logger';

// Extend Request to include user from Clerk middleware
interface AdminRequest extends Request {
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
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      subscriptionStatus = '',
      isProfileComplete = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (subscriptionStatus) {
      filter.subscriptionStatus = subscriptionStatus;
    }

    if (isProfileComplete !== '') {
      filter.isProfileComplete = isProfileComplete === 'true';
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('profile', 'firstName lastName phone location')
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Admin retrieved users list', {
      adminId,
      adminRole,
      totalUsers,
      page: pageNum,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all users failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
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
 * Get user details by ID
 */
export const getUserById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { userId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('profile')
      .populate('subscription')
      .lean();

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

    logger.info('Admin retrieved user details', {
      adminId,
      adminRole,
      targetUserId: userId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user by ID failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetUserId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user details'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user role and status
 */
export const updateUserRole = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { userId } = req.params;
    const { role, isActive, subscriptionStatus } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Super admin can change any role, regular admin can only change to user
    if (adminRole === 'admin' && role && role !== 'user') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Regular admins can only assign user roles'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

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

    logger.info('Admin updated user role/status', {
      adminId,
      adminRole,
      targetUserId: userId,
      changes: updateData,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update user role failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetUserId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { userId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

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

    // Prevent admin from deleting super admin
    if (user.role === 'super_admin' && adminRole !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Only super admins can delete super admin accounts'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Soft delete - mark as inactive and add deletion timestamp
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: adminId
    });

    logger.info('Admin soft deleted user', {
      adminId,
      adminRole,
      targetUserId: userId,
      targetUserRole: user.role,
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
      adminId: req.user?.id,
      targetUserId: req.params.userId,
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
 * Bulk update users
 */
export const bulkUpdateUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { userIds, updates } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User IDs array is required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Regular admin can only update user roles
    if (adminRole === 'admin' && updates.role && updates.role !== 'user') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Regular admins can only assign user roles'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update multiple users
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { ...updates, updatedAt: new Date() }
    );

    logger.info('Admin bulk updated users', {
      adminId,
      adminRole,
      targetUserIds: userIds,
      updates,
      modifiedCount: result.modifiedCount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        totalRequested: userIds.length
      },
      message: `Successfully updated ${result.modifiedCount} users`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bulk update users failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to bulk update users'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user activity and engagement metrics
 */
export const getUserActivity = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { userId } = req.params;
    const { period = '30d' } = req.query;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get user's job applications in the period
    const { JobApplication } = await import('../../models/JobApplication');
    const applications = await JobApplication.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    // Get user's profile updates in the period
    const profileUpdates = await UserProfile.findOne({ userId })
      .select('updatedAt')
      .lean();

    // Get user's subscription changes in the period
    const subscriptionChanges = await Subscription.find({
      userId,
      updatedAt: { $gte: startDate, $lte: endDate }
    }).sort({ updatedAt: -1 });

    logger.info('Admin retrieved user activity', {
      adminId,
      adminRole,
      targetUserId: userId,
      period,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        userId,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        activity: {
          applications: applications.length,
          applicationDetails: applications,
          lastProfileUpdate: profileUpdates?.updatedAt,
          subscriptionChanges: subscriptionChanges.length,
          subscriptionDetails: subscriptionChanges
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user activity failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetUserId: req.params.userId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user activity'
      },
      timestamp: new Date().toISOString()
    });
  }
};
