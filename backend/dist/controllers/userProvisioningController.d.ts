import { Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
    };
}
/**
 * Provision a new user (Admin only)
 */
export declare const provisionUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Bulk provision users (Admin only)
 */
export declare const bulkProvisionUsers: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get provisioning statistics (Admin only)
 */
export declare const getProvisioningStats: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Provision user from external system (Admin only)
 */
export declare const provisionFromExternal: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Test user provisioning (Admin only)
 */
export declare const testProvisioning: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userProvisioningController.d.ts.map