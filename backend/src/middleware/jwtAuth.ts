import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: any;
      };
    }
  }
}

const JWT_SECRET = config.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN || '24h'; // 24 hours by default

/**
 * Generate JWT token for user
 */
export const generateToken = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'super_admin';
  metadata?: any;
}): string => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    type: user.role === 'admin' || user.role === 'super_admin' ? 'admin' : 'user',
    metadata: user.metadata
  };

  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'notifyx-api',
    audience: 'notifyx-users'
  });
};

/**
 * Verify JWT token and extract user information
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'notifyx-api',
      audience: 'notifyx-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Core JWT authentication middleware
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
    
    try {
      // Verify the token
      const decoded = verifyToken(token);
      
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

      logger.info('User authenticated successfully', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip
      });

      next();
    } catch (error) {
      logger.error('Token verification failed', {
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
  } catch (error) {
    logger.error('Authentication middleware error', {
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
    
    try {
      // Try to verify the token, but don't fail if invalid
      const decoded = verifyToken(token);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        type: decoded.type,
        metadata: decoded.metadata
      };
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

