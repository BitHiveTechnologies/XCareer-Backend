import { Request, Response } from 'express';
/**
 * Get current user's resume
 */
export declare const getMyResume: (req: Request, res: Response) => Promise<void>;
/**
 * Create or update user's resume
 */
export declare const saveResume: (req: Request, res: Response) => Promise<void>;
/**
 * Get a public resume by ID (for sharing)
 */
export declare const getPublicResume: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=resumeController.d.ts.map