import { NextFunction, Request, Response } from 'express';
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
            userContext?: {
                id: string;
                role: string;
                subscriptionPlan?: string;
                subscriptionStatus?: string;
                isActive?: boolean;
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