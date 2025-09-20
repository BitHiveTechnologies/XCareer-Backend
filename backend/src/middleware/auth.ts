import { Request, Response, NextFunction } from 'express';

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

/**
 * Basic authentication middleware - placeholder for now
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implement proper JWT authentication
  // For now, create a mock user for testing
  req.user = {
    id: 'mock-user-id',
    email: 'mock@example.com',
    role: 'user',
    type: 'user'
  };
  
  next();
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
