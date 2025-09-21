"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireSuperAdmin = exports.requireAdmin = exports.authenticate = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const JWT_SECRET = environment_1.config.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = environment_1.config.JWT_EXPIRES_IN || '24h'; // 24 hours by default
/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        type: user.role === 'admin' || user.role === 'super_admin' ? 'admin' : 'user',
        metadata: user.metadata
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'notifyx-api',
        audience: 'notifyx-users'
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token and extract user information
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'notifyx-api',
            audience: 'notifyx-users'
        });
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
/**
 * Core JWT authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authorization header with Bearer token is required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        try {
            // Verify the token
            const decoded = (0, exports.verifyToken)(token);
            // Populate req.user with decoded token data
            req.user = {
                id: decoded.id,
                email: decoded.email,
                firstName: decoded.firstName,
                lastName: decoded.lastName,
                role: decoded.role,
                type: decoded.type,
                metadata: decoded.metadata
            };
            logger_1.logger.info('User authenticated successfully', {
                userId: req.user.id,
                email: req.user.email,
                role: req.user.role,
                ip: req.ip
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Token verification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip
            });
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid or expired token'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Authentication error'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.authenticate = authenticate;
/**
 * Admin-only middleware - requires admin authentication
 */
const requireAdmin = (req, res, next) => {
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
    if (req.user.type !== 'admin') {
        res.status(403).json({
            success: false,
            error: {
                message: 'Admin access required'
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Super admin middleware - requires super admin authentication
 */
const requireSuperAdmin = (req, res, next) => {
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
    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            success: false,
            error: {
                message: 'Super admin access required'
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
/**
 * Optional authentication middleware - populates user if token exists, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user
            next();
            return;
        }
        const token = authHeader.substring(7);
        try {
            // Try to verify the token, but don't fail if invalid
            const decoded = (0, exports.verifyToken)(token);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                firstName: decoded.firstName,
                lastName: decoded.lastName,
                role: decoded.role,
                type: decoded.type,
                metadata: decoded.metadata
            };
        }
        catch (error) {
            // Token verification failed, continue without user
            logger_1.logger.debug('Optional auth failed, continuing without user', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        next();
    }
    catch (error) {
        // Any other error, continue without user
        logger_1.logger.debug('Optional auth error, continuing without user', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=jwtAuth.js.map