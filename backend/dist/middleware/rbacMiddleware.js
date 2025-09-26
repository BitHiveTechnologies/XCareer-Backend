"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireResourceOwnership = exports.requireEnterpriseAccess = exports.requirePremiumAccess = exports.requireActiveSubscription = exports.requireAdminPermission = exports.requirePermission = void 0;
const rbacService_1 = require("../services/rbacService");
const logger_1 = require("../utils/logger");
/**
 * RBAC Middleware for Express
 * Provides role-based access control for API endpoints
 */
/**
 * Middleware to check if user has permission for specific resource and action
 */
const requirePermission = (resource, action) => {
    return (req, res, next) => {
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
            const userContext = {
                id: req.user.id,
                role: req.user.role,
                subscriptionPlan: req.user.metadata?.subscriptionPlan,
                subscriptionStatus: req.user.metadata?.subscriptionStatus,
                isActive: req.user.metadata?.isActive !== false,
            };
            const hasPermission = rbacService_1.RBACService.hasPermission(userContext, resource, action);
            if (!hasPermission) {
                logger_1.logger.warn('Permission denied', {
                    userId: req.user.id,
                    role: req.user.role,
                    resource,
                    action,
                    ip: req.ip
                });
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Insufficient permissions',
                        required: { resource, action }
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Add user context to request for use in controllers
            req.userContext = userContext;
            next();
        }
        catch (error) {
            logger_1.logger.error('RBAC middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                resource,
                action,
                ip: req.ip
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Authorization error'
                },
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has admin permissions
 */
const requireAdminPermission = (req, res, next) => {
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
        const userContext = {
            id: req.user.id,
            role: req.user.role,
            subscriptionPlan: req.user.metadata?.subscriptionPlan,
            subscriptionStatus: req.user.metadata?.subscriptionStatus,
            isActive: req.user.metadata?.isActive !== false,
        };
        if (!rbacService_1.RBACService.isAdmin(userContext)) {
            logger_1.logger.warn('Admin permission denied', {
                userId: req.user.id,
                role: req.user.role,
                ip: req.ip
            });
            res.status(403).json({
                success: false,
                error: {
                    message: 'Admin permissions required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        req.userContext = userContext;
        next();
    }
    catch (error) {
        logger_1.logger.error('Admin permission middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Authorization error'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.requireAdminPermission = requireAdminPermission;
/**
 * Middleware to check if user has active subscription
 */
const requireActiveSubscription = (req, res, next) => {
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
        const userContext = {
            id: req.user.id,
            role: req.user.role,
            subscriptionPlan: req.user.metadata?.subscriptionPlan,
            subscriptionStatus: req.user.metadata?.subscriptionStatus,
            isActive: req.user.metadata?.isActive !== false,
        };
        if (!rbacService_1.RBACService.hasActiveSubscription(userContext)) {
            logger_1.logger.warn('Active subscription required', {
                userId: req.user.id,
                subscriptionStatus: userContext.subscriptionStatus,
                ip: req.ip
            });
            res.status(403).json({
                success: false,
                error: {
                    message: 'Active subscription required',
                    subscriptionStatus: userContext.subscriptionStatus
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        req.userContext = userContext;
        next();
    }
    catch (error) {
        logger_1.logger.error('Subscription check middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Authorization error'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.requireActiveSubscription = requireActiveSubscription;
/**
 * Middleware to check if user can access premium features
 */
const requirePremiumAccess = (req, res, next) => {
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
        const userContext = {
            id: req.user.id,
            role: req.user.role,
            subscriptionPlan: req.user.metadata?.subscriptionPlan,
            subscriptionStatus: req.user.metadata?.subscriptionStatus,
            isActive: req.user.metadata?.isActive !== false,
        };
        if (!rbacService_1.RBACService.canAccessPremiumFeatures(userContext)) {
            logger_1.logger.warn('Premium access required', {
                userId: req.user.id,
                subscriptionPlan: userContext.subscriptionPlan,
                subscriptionStatus: userContext.subscriptionStatus,
                ip: req.ip
            });
            res.status(403).json({
                success: false,
                error: {
                    message: 'Premium subscription required',
                    currentPlan: userContext.subscriptionPlan,
                    requiredPlans: ['premium', 'enterprise']
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        req.userContext = userContext;
        next();
    }
    catch (error) {
        logger_1.logger.error('Premium access middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Authorization error'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.requirePremiumAccess = requirePremiumAccess;
/**
 * Middleware to check if user can access enterprise features
 */
const requireEnterpriseAccess = (req, res, next) => {
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
        const userContext = {
            id: req.user.id,
            role: req.user.role,
            subscriptionPlan: req.user.metadata?.subscriptionPlan,
            subscriptionStatus: req.user.metadata?.subscriptionStatus,
            isActive: req.user.metadata?.isActive !== false,
        };
        if (!rbacService_1.RBACService.canAccessEnterpriseFeatures(userContext)) {
            logger_1.logger.warn('Enterprise access required', {
                userId: req.user.id,
                subscriptionPlan: userContext.subscriptionPlan,
                subscriptionStatus: userContext.subscriptionStatus,
                ip: req.ip
            });
            res.status(403).json({
                success: false,
                error: {
                    message: 'Enterprise subscription required',
                    currentPlan: userContext.subscriptionPlan,
                    requiredPlan: 'enterprise'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        req.userContext = userContext;
        next();
    }
    catch (error) {
        logger_1.logger.error('Enterprise access middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Authorization error'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.requireEnterpriseAccess = requireEnterpriseAccess;
/**
 * Middleware to validate resource ownership
 */
const requireResourceOwnership = (resourceIdParam = 'id') => {
    return (req, res, next) => {
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
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;
            // Admin users can access any resource
            if (req.user.role === 'admin' || req.user.role === 'super_admin') {
                next();
                return;
            }
            // Check if user owns the resource
            if (resourceId !== userId) {
                logger_1.logger.warn('Resource ownership denied', {
                    userId,
                    resourceId,
                    resourceIdParam,
                    ip: req.ip
                });
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied - resource ownership required'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Resource ownership middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Authorization error'
                },
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.requireResourceOwnership = requireResourceOwnership;
//# sourceMappingURL=rbacMiddleware.js.map