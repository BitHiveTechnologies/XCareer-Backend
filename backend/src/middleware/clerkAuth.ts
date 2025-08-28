import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { clerkConfig } from '../config/clerk';
import { logger } from '../utils/logger';

// Note: Express Request interface is extended in auth.ts
// This middleware adds Clerk-specific user properties

/**
 * Clerk authentication middleware
 * Verifies the session token and populates req.user
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    
    // Verify the token with Clerk
    const payload = await verifyToken(token, {
      jwtKey: clerkConfig.jwtKey,
      secretKey: clerkConfig.secretKey
    });

    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user details from Clerk
    const clerk = createClerkClient({ secretKey: clerkConfig.secretKey });
    const clerkUser = await clerk.users.getUser(payload.sub);
    
    if (!clerkUser) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Determine user role from Clerk metadata or default to 'user'
    const userRole = clerkUser.publicMetadata?.role || 'user';
    const userType = userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'user';

    // Populate req.user with Clerk user data
    req.user = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      role: userRole as 'user' | 'admin' | 'super_admin',
      type: userType,
      clerkUserId: clerkUser.id,
      metadata: clerkUser.publicMetadata
    };

    logger.info('User authenticated successfully', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Admin-only middleware - requires admin authentication
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Super admin middleware - requires super admin authentication
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Optional authentication middleware - populates user if token exists, but doesn't fail if missing
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    // Try to verify the token, but don't fail if invalid
    try {
      const payload = await verifyToken(token, {
        jwtKey: clerkConfig.jwtKey,
        secretKey: clerkConfig.secretKey
      });

      if (payload) {
        const clerk = createClerkClient({ secretKey: clerkConfig.secretKey });
        const clerkUser = await clerk.users.getUser(payload.sub);
        
        if (clerkUser) {
          const userRole = clerkUser.publicMetadata?.role || 'user';
          const userType = userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'user';

          req.user = {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            role: userRole as 'user' | 'admin' | 'super_admin',
            type: userType,
            clerkUserId: clerkUser.id,
            metadata: clerkUser.publicMetadata
          };
        }
      }
    } catch (error) {
      // Token verification failed, continue without user
      logger.debug('Optional auth failed, continuing without user', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    next();
  } catch (error) {
    // Any other error, continue without user
    logger.debug('Optional auth error, continuing without user', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next();
  }
};
