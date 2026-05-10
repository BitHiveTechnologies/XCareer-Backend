import { Request, Response } from 'express';
import { AuthenticatedRequest as AuthRequest } from '../../types/express';
/**
 * User registration
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * User login
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Refresh access token
 */
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
/**
 * User logout
 */
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get current user profile
 */
export declare const getCurrentUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Change password
 */
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map