import { Request, Response } from 'express';
export interface ClerkAuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId: string;
        metadata?: Record<string, any>;
    };
}
/**
 * Get current authenticated user profile
 */
export declare const getCurrentUser: (req: ClerkAuthRequest, res: Response) => Promise<void>;
/**
 * Update current user profile
 */
export declare const updateUserProfile: (req: ClerkAuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=clerkAuthController.d.ts.map