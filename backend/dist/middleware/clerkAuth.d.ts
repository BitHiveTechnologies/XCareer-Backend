import { Request, Response, NextFunction } from 'express';
/**
 * Clerk authentication middleware
 * Verifies the session token and populates req.user
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin-only middleware - requires admin authentication
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Super admin middleware - requires super admin authentication
 */
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware - populates user if token exists, but doesn't fail if missing
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=clerkAuth.d.ts.map