"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getProfile = exports.logout = exports.refreshToken = exports.adminLogin = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const Admin_1 = require("../models/Admin");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
// In-memory token blacklist (in production, use Redis)
const tokenBlacklist = new Set();
/**
 * User registration
 */
const register = async (req, res) => {
    try {
        const { email, password, name, mobile } = req.body;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
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
        // Create new user
        const user = new User_1.User({
            email: email.toLowerCase(),
            password,
            name,
            mobile
        });
        await user.save();
        // Generate tokens
        const tokens = (0, jwt_1.generateTokenPair)({
            userId: user._id.toString(),
            email: user.email
        });
        // Log successful registration
        logger_1.logger.info('User registered successfully', {
            userId: user._id.toString(),
            email: user.email,
            ip: req.ip
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    mobile: user.mobile,
                    subscriptionPlan: user.subscriptionPlan,
                    subscriptionStatus: user.subscriptionStatus,
                    isProfileComplete: user.isProfileComplete
                },
                tokens
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
                message: 'Registration failed'
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
        // Find user by email
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
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
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
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
        // Generate tokens
        const tokens = (0, jwt_1.generateTokenPair)({
            userId: user._id.toString(),
            email: user.email
        });
        // Log successful login
        logger_1.logger.info('User logged in successfully', {
            userId: user._id.toString(),
            email: user.email,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    mobile: user.mobile,
                    subscriptionPlan: user.subscriptionPlan,
                    subscriptionStatus: user.subscriptionStatus,
                    isProfileComplete: user.isProfileComplete
                },
                tokens
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
                message: 'Login failed'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.login = login;
/**
 * Admin login
 */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find admin by email
        const admin = await Admin_1.Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Check if admin is active
        if (!admin.isActive) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Admin account is inactive'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Verify password
        const isPasswordValid = await admin.comparePassword(password);
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
        // Generate tokens
        const tokens = (0, jwt_1.generateTokenPair)({
            userId: admin._id.toString(),
            email: admin.email,
            role: admin.role
        });
        // Log successful admin login
        logger_1.logger.info('Admin logged in successfully', {
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            data: {
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    permissions: admin.permissions
                },
                tokens
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Admin login failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email: req.body.email,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Admin login failed'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.adminLogin = adminLogin;
/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
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
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        // Check if token is blacklisted
        if (tokenBlacklist.has(refreshToken)) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Refresh token has been revoked'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Generate new access token
        const newAccessToken = (0, jwt_1.generateAccessToken)({
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        });
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
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
                message: 'Token refresh failed'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.refreshToken = refreshToken;
/**
 * Logout (blacklist tokens)
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            tokenBlacklist.add(token);
        }
        // If refresh token is provided in body, blacklist it too
        if (req.body.refreshToken) {
            tokenBlacklist.add(req.body.refreshToken);
        }
        // Log successful logout
        if (req.user) {
            logger_1.logger.info('User logged out successfully', {
                userId: req.user.id,
                email: req.user.email,
                ip: req.ip
            });
        }
        res.status(200).json({
            success: true,
            message: 'Logout successful',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Logout failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Logout failed'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.logout = logout;
/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        let user;
        if (req.user.type === 'admin') {
            user = await Admin_1.Admin.findById(req.user.id).select('-password');
        }
        else {
            user = await User_1.User.findById(req.user.id).select('-password');
        }
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
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    ...(req.user.type === 'admin' ? {
                        role: user.role,
                        permissions: user.permissions,
                        isActive: user.isActive
                    } : {
                        mobile: user.mobile,
                        subscriptionPlan: user.subscriptionPlan,
                        subscriptionStatus: user.subscriptionStatus,
                        isProfileComplete: user.isProfileComplete
                    })
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get profile'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getProfile = getProfile;
/**
 * Change password
 */
const changePassword = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Current password and new password are required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        let user;
        if (req.user.type === 'admin') {
            user = await Admin_1.Admin.findById(req.user.id);
        }
        else {
            user = await User_1.User.findById(req.user.id);
        }
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
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
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
        // Update password
        user.password = newPassword;
        await user.save();
        // Log password change
        logger_1.logger.info('Password changed successfully', {
            userId: req.user.id,
            email: req.user.email,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
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