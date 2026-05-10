import { Request, Response } from 'express';
/**
 * User registration
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * User login
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Admin login
 */
export declare const adminLogin: (req: Request, res: Response) => Promise<void>;
/**
 * Refresh access token
 */
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
/**
 * Logout (blacklist tokens)
 */
export declare const logout: (req: Request, res: Response) => Promise<void>;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Change password
 */
export declare const changePassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map