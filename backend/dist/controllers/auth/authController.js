"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getCurrentUser = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../../utils/logger");
const jwt_1 = require("../../utils/jwt");
const User_1 = require("../../models/User");
const UserProfile_1 = require("../../models/UserProfile");
const environment_1 = require("../../config/environment");
/**
 * User registration
 */
const register = async (req, res) => {
    try {
        const { name, email, password, mobile, qualification, stream, yearOfPassout, cgpaOrPercentage } = req.body;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
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
        const saltRounds = environment_1.config.BCRYPT_ROUNDS;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const user = new User_1.User({
            name,
            email,
            password: hashedPassword,
            mobile,
            subscriptionPlan: 'basic',
            subscriptionStatus: 'inactive'
        });
        await user.save();
        // Create user profile
        const userProfile = new UserProfile_1.UserProfile({
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
            role: 'user'
        };
        const accessToken = (0, jwt_1.generateToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user._id.toString(),
            tokenVersion: 0
        });
        logger_1.logger.info('User registered successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('User registration failed', {
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
exports.register = register;
/**
 * User login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User_1.User.findOne({ email }).select('+password');
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
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
            role: 'user'
        };
        const accessToken = (0, jwt_1.generateToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user._id.toString(),
            tokenVersion: 0
        });
        // Update subscription status if needed
        if (user.subscriptionStatus === 'inactive') {
            user.subscriptionStatus = 'active';
            await user.save();
        }
        logger_1.logger.info('User logged in successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('User login failed', {
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
exports.login = login;
/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
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
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshTokenFromBody);
        // Find user
        const user = await User_1.User.findById(decoded.userId);
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
            role: 'user'
        };
        const newAccessToken = (0, jwt_1.generateToken)(tokenPayload);
        logger_1.logger.info('Access token refreshed successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('Token refresh failed', {
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
exports.refreshToken = refreshToken;
/**
 * User logout
 */
const logout = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            // In a real implementation, you might want to blacklist the token
            // For now, we'll just log the logout
            logger_1.logger.info('User logged out successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('User logout failed', {
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
exports.logout = logout;
/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
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
        const user = await User_1.User.findById(userId).select('-password');
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
        const userProfile = await UserProfile_1.UserProfile.findOne({ userId });
        logger_1.logger.info('Current user profile retrieved', {
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
    }
    catch (error) {
        logger_1.logger.error('Get current user failed', {
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
exports.getCurrentUser = getCurrentUser;
/**
 * Change password
 */
const changePassword = async (req, res) => {
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
        const user = await User_1.User.findById(userId).select('+password');
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
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
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
        const saltRounds = environment_1.config.BCRYPT_ROUNDS;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password
        user.password = hashedNewPassword;
        await user.save();
        logger_1.logger.info('Password changed successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('Password change failed', {
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
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map