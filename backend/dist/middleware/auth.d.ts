import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                firstName?: string;
                lastName?: string;
                role?: 'user' | 'admin' | 'super_admin';
                type: 'user' | 'admin';
                clerkUserId?: string;
                metadata?: Record<string, any>;
            };
        }
    }
}
/**
 * Basic authentication middleware - placeholder for now
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin-only middleware - requires admin authentication
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map