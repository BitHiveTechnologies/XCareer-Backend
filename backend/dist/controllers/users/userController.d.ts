import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
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
/**
 * Get current authenticated user's profile
 */
export declare const getCurrentUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update current authenticated user's profile
 */
export declare const updateCurrentUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get profile completion status for current user
 */
export declare const getProfileCompletionStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get user profile by ID
 */
export declare const getUserProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Update user profile
 */
export declare const updateUserProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Get all users (admin only)
 */
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Delete user (admin only)
 */
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
/**
 * Get user statistics (admin only)
 */
export declare const getUserStats: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=userController.d.ts.map