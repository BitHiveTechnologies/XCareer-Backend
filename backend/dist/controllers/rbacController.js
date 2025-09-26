"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccess = exports.getSubscriptionLimits = exports.getRolesAndPermissions = exports.checkPermission = exports.getUserPermissions = void 0;
const rbacService_1 = require("../services/rbacService");
const logger_1 = require("../utils/logger");
/**
 * RBAC Controller
 * Handles role-based access control operations
 */
/**
 * Get user's permissions
 */
const getUserPermissions = async (req, res) => {
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
        const permissions = rbacService_1.RBACService.getUserPermissions(userContext);
        const limits = rbacService_1.RBACService.getSubscriptionLimits(userContext);
        res.json({
            success: true,
            data: {
                user: {
                    id: userContext.id,
                    role: userContext.role,
                    subscriptionPlan: userContext.subscriptionPlan,
                    subscriptionStatus: userContext.subscriptionStatus,
                },
                permissions,
                limits,
                capabilities: {
                    isAdmin: rbacService_1.RBACService.isAdmin(userContext),
                    hasActiveSubscription: rbacService_1.RBACService.hasActiveSubscription(userContext),
                    canAccessPremiumFeatures: rbacService_1.RBACService.canAccessPremiumFeatures(userContext),
                    canAccessEnterpriseFeatures: rbacService_1.RBACService.canAccessEnterpriseFeatures(userContext),
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get user permissions failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get user permissions'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getUserPermissions = getUserPermissions;
/**
 * Check if user has specific permission
 */
const checkPermission = async (req, res) => {
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
        const { resource, action } = req.body;
        if (!resource || !action) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Resource and action are required'
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
        const validation = rbacService_1.RBACService.validateAccess(userContext, resource, action);
        res.json({
            success: true,
            data: {
                hasPermission,
                validation,
                user: {
                    id: userContext.id,
                    role: userContext.role,
                    subscriptionPlan: userContext.subscriptionPlan,
                },
                permission: { resource, action }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Check permission failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            resource: req.body?.resource,
            action: req.body?.action
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to check permission'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.checkPermission = checkPermission;
/**
 * Get all available roles and permissions (admin only)
 */
const getRolesAndPermissions = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Admin permissions required'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            success: true,
            data: {
                roles: rbacService_1.ROLES,
                subscriptionPermissions: rbacService_1.SUBSCRIPTION_PERMISSIONS,
                availableRoles: Object.keys(rbacService_1.ROLES),
                availablePlans: Object.keys(rbacService_1.SUBSCRIPTION_PERMISSIONS)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get roles and permissions failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get roles and permissions'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getRolesAndPermissions = getRolesAndPermissions;
/**
 * Get user's subscription limits
 */
const getSubscriptionLimits = async (req, res) => {
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
        const limits = rbacService_1.RBACService.getSubscriptionLimits(userContext);
        res.json({
            success: true,
            data: {
                limits,
                subscriptionPlan: userContext.subscriptionPlan,
                subscriptionStatus: userContext.subscriptionStatus,
                hasActiveSubscription: rbacService_1.RBACService.hasActiveSubscription(userContext)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get subscription limits failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get subscription limits'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getSubscriptionLimits = getSubscriptionLimits;
/**
 * Validate user access to specific resource
 */
const validateAccess = async (req, res) => {
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
        const { resource, action, conditions } = req.body;
        if (!resource || !action) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Resource and action are required'
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
        const validation = rbacService_1.RBACService.validateAccess(userContext, resource, action, conditions);
        res.json({
            success: true,
            data: {
                validation,
                user: {
                    id: userContext.id,
                    role: userContext.role,
                    subscriptionPlan: userContext.subscriptionPlan,
                    subscriptionStatus: userContext.subscriptionStatus,
                },
                access: { resource, action, conditions }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Validate access failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            resource: req.body?.resource,
            action: req.body?.action
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to validate access'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.validateAccess = validateAccess;
//# sourceMappingURL=rbacController.js.map