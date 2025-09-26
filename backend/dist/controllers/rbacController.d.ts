import { Request, Response } from 'express';
/**
 * RBAC Controller
 * Handles role-based access control operations
 */
/**
 * Get user's permissions
 */
export declare const getUserPermissions: (req: Request, res: Response) => Promise<void>;
/**
 * Check if user has specific permission
 */
export declare const checkPermission: (req: Request, res: Response) => Promise<void>;
/**
 * Get all available roles and permissions (admin only)
 */
export declare const getRolesAndPermissions: (req: Request, res: Response) => Promise<void>;
/**
 * Get user's subscription limits
 */
export declare const getSubscriptionLimits: (req: Request, res: Response) => Promise<void>;
/**
 * Validate user access to specific resource
 */
export declare const validateAccess: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=rbacController.d.ts.map