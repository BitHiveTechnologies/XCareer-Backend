import { Request, Response } from 'express';
/**
 * Provision a new user (Admin only)
 */
export declare const provisionUser: (req: Request, res: Response) => Promise<void>;
/**
 * Bulk provision users (Admin only)
 */
export declare const bulkProvisionUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Get provisioning statistics (Admin only)
 */
export declare const getProvisioningStats: (req: Request, res: Response) => Promise<void>;
/**
 * Provision user from external system (Admin only)
 */
export declare const provisionFromExternal: (req: Request, res: Response) => Promise<void>;
/**
 * Test user provisioning (Admin only)
 */
export declare const testProvisioning: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userProvisioningController.d.ts.map