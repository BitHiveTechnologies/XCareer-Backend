import { Response } from 'express';
import { ClerkAuthRequest } from '../../types/express';
/**
 * Get current authenticated user profile
 */
export declare const getCurrentUser: (req: ClerkAuthRequest, res: Response) => Promise<void>;
/**
 * Update current user profile
 */
export declare const updateUserProfile: (req: ClerkAuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=clerkAuthController.d.ts.map