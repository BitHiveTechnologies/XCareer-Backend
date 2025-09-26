"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireSuperAdmin = exports.requireAdmin = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
// JWT utility functions are imported from '../utils/jwt'
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
            // Verify the token using JWT utility
            const decoded = (0, jwt_1.verifyToken)(token);
            logger_1.logger.info('JWT middleware - Token decoded', {
                decoded,
                userIdFromDecoded: decoded.userId,
                idFromDecoded: decoded.userId // using userId as it's the correct field
            });
            // Populate req.user with decoded token data
            req.user = {
                id: decoded.userId, // JWT utility uses userId field
                email: decoded.email,
                firstName: '', // JWT utility doesn't include firstName/lastName
                lastName: '', // JWT utility doesn't include firstName/lastName
                role: decoded.role,
                type: decoded.role === 'admin' || decoded.role === 'super_admin' ? 'admin' : 'user',
                metadata: {}
            };
            logger_1.logger.info('JWT middleware - User populated', {
                reqUser: req.user,
                userId: req.user.id,
                email: req.user.email,
                role: req.user.role
            });
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
            // Try to verify the token using JWT utility, but don't fail if invalid
            const decoded = (0, jwt_1.verifyToken)(token);
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                firstName: '',
                lastName: '',
                role: decoded.role,
                type: decoded.role === 'admin' || decoded.role === 'super_admin' ? 'admin' : 'user',
                metadata: {}
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