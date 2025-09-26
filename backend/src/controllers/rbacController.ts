import { Request, Response } from 'express';
import { RBACService, ROLES, SUBSCRIPTION_PERMISSIONS } from '../services/rbacService';
import { logger } from '../utils/logger';

/**
 * RBAC Controller
 * Handles role-based access control operations
 */

/**
 * Get user's permissions
 */
export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
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

    const permissions = RBACService.getUserPermissions(userContext);
    const limits = RBACService.getSubscriptionLimits(userContext);

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
          isAdmin: RBACService.isAdmin(userContext),
          hasActiveSubscription: RBACService.hasActiveSubscription(userContext),
          canAccessPremiumFeatures: RBACService.canAccessPremiumFeatures(userContext),
          canAccessEnterpriseFeatures: RBACService.canAccessEnterpriseFeatures(userContext),
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user permissions failed', {
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

/**
 * Check if user has specific permission
 */
export const checkPermission = async (req: Request, res: Response): Promise<void> => {
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

    const hasPermission = RBACService.hasPermission(userContext, resource, action);
    const validation = RBACService.validateAccess(userContext, resource, action);

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
  } catch (error) {
    logger.error('Check permission failed', {
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

/**
 * Get all available roles and permissions (admin only)
 */
export const getRolesAndPermissions = async (req: Request, res: Response): Promise<void> => {
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
        roles: ROLES,
        subscriptionPermissions: SUBSCRIPTION_PERMISSIONS,
        availableRoles: Object.keys(ROLES),
        availablePlans: Object.keys(SUBSCRIPTION_PERMISSIONS)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get roles and permissions failed', {
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

/**
 * Get user's subscription limits
 */
export const getSubscriptionLimits = async (req: Request, res: Response): Promise<void> => {
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

    const limits = RBACService.getSubscriptionLimits(userContext);

    res.json({
      success: true,
      data: {
        limits,
        subscriptionPlan: userContext.subscriptionPlan,
        subscriptionStatus: userContext.subscriptionStatus,
        hasActiveSubscription: RBACService.hasActiveSubscription(userContext)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get subscription limits failed', {
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

/**
 * Validate user access to specific resource
 */
export const validateAccess = async (req: Request, res: Response): Promise<void> => {
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

    const validation = RBACService.validateAccess(userContext, resource, action, conditions);

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
  } catch (error) {
    logger.error('Validate access failed', {
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
