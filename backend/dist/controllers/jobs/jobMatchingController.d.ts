import { Request, Response } from 'express';
/**
 * Get matching jobs for a user
 */
export declare const getMatchingJobs: (req: Request, res: Response) => Promise<void>;
/**
 * Get matching users for a job (admin only)
 */
export declare const getMatchingUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Get personalized job recommendations for a user
 */
export declare const getJobRecommendationsForUser: (req: Request, res: Response) => Promise<void>;
/**
 * Get job matching statistics (admin only)
 */
export declare const getMatchingStats: (req: Request, res: Response) => Promise<void>;
/**
 * Get advanced job matching with filters and sorting (admin only)
 */
export declare const getAdvancedJobMatching: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=jobMatchingController.d.ts.map