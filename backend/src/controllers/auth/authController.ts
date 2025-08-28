import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { config } from '../../config/environment';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
  };
}

/**
 * User registration
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile, qualification, stream, yearOfPassout, cgpaOrPercentage } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password
    const saltRounds = config.BCRYPT_ROUNDS;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      subscriptionPlan: 'basic',
      subscriptionStatus: 'inactive'
    });

    await user.save();

    // Create user profile
    const userProfile = new UserProfile({
      userId: user._id,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      email,
      contactNumber: mobile,
      dateOfBirth: new Date(), // Default value, can be updated later
      qualification,
      stream,
      yearOfPassout,
      cgpaOrPercentage,
      collegeName: 'Not specified' // Default value, can be updated later
    });

    await userProfile.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'user' as const
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: 0
    });

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'user'
        },
        accessToken,
        refreshToken,
        message: 'User registered successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('User registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to register user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user subscription is active
    if (user.subscriptionStatus === 'expired') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Account subscription has expired'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'user' as const
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      tokenVersion: 0
    });

    // Update subscription status if needed
    if (user.subscriptionStatus === 'inactive') {
      user.subscriptionStatus = 'active';
      await user.save();
    }

    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'user'
        },
        accessToken,
        refreshToken,
        message: 'Login successful'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('User login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to login'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenFromBody);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || user.subscriptionStatus === 'expired') {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found or subscription expired'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'user' as const
    };

    const newAccessToken = generateToken(tokenPayload);

    logger.info('Access token refreshed successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just log the logout
      logger.info('User logged out successfully', {
        userId,
        ip: req.ip
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Logout successful'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('User logout failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to logout'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

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

    const userProfile = await UserProfile.findOne({ userId });

    logger.info('Current user profile retrieved', {
      userId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'user',
          mobile: user.mobile,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionPlan: user.subscriptionPlan
        },
        profile: userProfile ? {
          qualification: userProfile.qualification,
          stream: userProfile.stream,
          yearOfPassout: userProfile.yearOfPassout,
          cgpaOrPercentage: userProfile.cgpaOrPercentage
        } : null
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
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user with password
    const user = await User.findById(userId).select('+password');
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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash new password
    const saltRounds = config.BCRYPT_ROUNDS;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    logger.info('Password changed successfully', {
      userId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Password change failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to change password'
      },
      timestamp: new Date().toISOString()
    });
  }
};
