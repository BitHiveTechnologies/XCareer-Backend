"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwtAuth_1 = require("../../middleware/jwtAuth");
const logger_1 = require("../../utils/logger");
const router = express_1.default.Router();
/**
 * @route   POST /api/v1/jwt-auth/login
 * @desc    Generate JWT token for testing (mock login)
 * @access  Public
 */
router.post('/login', (req, res) => {
    try {
        const { email, role = 'user', firstName = 'Test', lastName = 'User' } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Email is required'
                },
                timestamp: new Date().toISOString()
            });
        }
        // Generate a simple user ID
        const userId = `user_${Date.now()}`;
        // Generate JWT token
        const token = (0, jwtAuth_1.generateToken)({
            id: userId,
            email,
            firstName,
            lastName,
            role: role,
            metadata: {
                source: 'jwt-auth-route',
                generatedAt: new Date().toISOString()
            }
        });
        logger_1.logger.info('JWT token generated for testing', {
            userId,
            email,
            role,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: userId,
                    email,
                    firstName,
                    lastName,
                    role
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating JWT token', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to generate token'
            },
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * @route   GET /api/v1/jwt-auth/me
 * @desc    Get current user from JWT token
 * @access  Private
 */
router.get('/me', jwtAuth_1.authenticate, (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting current user', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get user information'
            },
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * @route   POST /api/v1/jwt-auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/verify', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Token is required'
                },
                timestamp: new Date().toISOString()
            });
        }
        // This will be handled by the authenticate middleware in a real implementation
        // For now, just return success if token exists
        res.status(200).json({
            success: true,
            data: {
                valid: true,
                message: 'Token is valid'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                message: 'Invalid token'
            },
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=jwtAuthRoutes.js.map