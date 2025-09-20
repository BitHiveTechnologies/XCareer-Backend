import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: 'user' | 'admin' | 'super_admin';
                type: 'user' | 'admin';
                metadata?: any;
            };
        }
    }
}
/**
 * Generate JWT token for user
 */
export declare const generateToken: (user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin" | "super_admin";
    metadata?: any;
}) => string;
/**
 * Verify JWT token and extract user information
 */
export declare const verifyToken: (token: string) => any;
/**
 * Core JWT authentication middleware
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
//# sourceMappingURL=jwtAuth.d.ts.map