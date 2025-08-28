import { Request, Response } from 'express';
/**
 * Apply for a job
 */
export declare const applyForJob: (req: Request, res: Response) => Promise<void>;
/**
 * Get user's job applications
 */
export declare const getUserApplications: (req: Request, res: Response) => Promise<void>;
/**
 * Get job applications for a specific job (admin only)
 */
export declare const getJobApplications: (req: Request, res: Response) => Promise<void>;
/**
 * Update application status (admin only)
 */
export declare const updateApplicationStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Withdraw application
 */
export declare const withdrawApplication: (req: Request, res: Response) => Promise<void>;
/**
 * Get application statistics (admin only)
 */
export declare const getApplicationStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=jobApplicationController.d.ts.map