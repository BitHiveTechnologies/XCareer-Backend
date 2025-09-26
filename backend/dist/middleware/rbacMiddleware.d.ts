import { NextFunction, Request, Response } from 'express';
/**
 * RBAC Middleware for Express
 * Provides role-based access control for API endpoints
 */
/**
 * Middleware to check if user has permission for specific resource and action
 */
export declare const requirePermission: (resource: string, action: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has admin permissions
 */
export declare const requireAdminPermission: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has active subscription
 */
export declare const requireActiveSubscription: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user can access premium features
 */
export declare const requirePremiumAccess: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user can access enterprise features
 */
export declare const requireEnterpriseAccess: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate resource ownership
 */
export declare const requireResourceOwnership: (resourceIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbacMiddleware.d.ts.map