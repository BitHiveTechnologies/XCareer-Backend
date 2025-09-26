import { NextFunction, Request, Response } from 'express';
import { RBACService, UserContext } from '../services/rbacService';
import { logger } from '../utils/logger';

/**
 * RBAC Middleware for Express
 * Provides role-based access control for API endpoints
 */

/**
 * Middleware to check if user has permission for specific resource and action
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

      const userContext: UserContext = {
        id: req.user.id,
        role: req.user.role,
        subscriptionPlan: req.user.metadata?.subscriptionPlan,
        subscriptionStatus: req.user.metadata?.subscriptionStatus,
        isActive: req.user.metadata?.isActive !== false,
      };

      const hasPermission = RBACService.hasPermission(userContext, resource, action);

      if (!hasPermission) {
        logger.warn('Permission denied', {
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
    } catch (error) {
      logger.error('RBAC middleware error', {
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

/**
 * Middleware to check if user has admin permissions
 */
export const requireAdminPermission = (req: Request, res: Response, next: NextFunction): void => {
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

    const userContext: UserContext = {
      id: req.user.id,
      role: req.user.role,
      subscriptionPlan: req.user.metadata?.subscriptionPlan,
      subscriptionStatus: req.user.metadata?.subscriptionStatus,
      isActive: req.user.metadata?.isActive !== false,
    };

    if (!RBACService.isAdmin(userContext)) {
      logger.warn('Admin permission denied', {
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
  } catch (error) {
    logger.error('Admin permission middleware error', {
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

/**
 * Middleware to check if user has active subscription
 */
export const requireActiveSubscription = (req: Request, res: Response, next: NextFunction): void => {
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

    const userContext: UserContext = {
      id: req.user.id,
      role: req.user.role,
      subscriptionPlan: req.user.metadata?.subscriptionPlan,
      subscriptionStatus: req.user.metadata?.subscriptionStatus,
      isActive: req.user.metadata?.isActive !== false,
    };

    if (!RBACService.hasActiveSubscription(userContext)) {
      logger.warn('Active subscription required', {
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
  } catch (error) {
    logger.error('Subscription check middleware error', {
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

/**
 * Middleware to check if user can access premium features
 */
export const requirePremiumAccess = (req: Request, res: Response, next: NextFunction): void => {
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

    const userContext: UserContext = {
      id: req.user.id,
      role: req.user.role,
      subscriptionPlan: req.user.metadata?.subscriptionPlan,
      subscriptionStatus: req.user.metadata?.subscriptionStatus,
      isActive: req.user.metadata?.isActive !== false,
    };

    if (!RBACService.canAccessPremiumFeatures(userContext)) {
      logger.warn('Premium access required', {
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
  } catch (error) {
    logger.error('Premium access middleware error', {
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

/**
 * Middleware to check if user can access enterprise features
 */
export const requireEnterpriseAccess = (req: Request, res: Response, next: NextFunction): void => {
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

    const userContext: UserContext = {
      id: req.user.id,
      role: req.user.role,
      subscriptionPlan: req.user.metadata?.subscriptionPlan,
      subscriptionStatus: req.user.metadata?.subscriptionStatus,
      isActive: req.user.metadata?.isActive !== false,
    };

    if (!RBACService.canAccessEnterpriseFeatures(userContext)) {
      logger.warn('Enterprise access required', {
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
  } catch (error) {
    logger.error('Enterprise access middleware error', {
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

/**
 * Middleware to validate resource ownership
 */
export const requireResourceOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
        logger.warn('Resource ownership denied', {
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
    } catch (error) {
      logger.error('Resource ownership middleware error', {
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
