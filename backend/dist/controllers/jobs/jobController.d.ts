import { Request, Response } from 'express';
/**
 * Create a new job posting
 */
export declare const createJob: (req: Request, res: Response) => Promise<void>;
/**
 * Get all jobs with filtering and pagination
 */
export declare const getAllJobs: (req: Request, res: Response) => Promise<void>;
/**
 * Get a specific job by ID
 */
export declare const getJobById: (req: Request, res: Response) => Promise<void>;
/**
 * Update a job posting
 */
export declare const updateJob: (req: Request, res: Response) => Promise<void>;
/**
 * Delete a job posting
 */
export declare const deleteJob: (req: Request, res: Response) => Promise<void>;
/**
 * Toggle job status (active/inactive)
 */
export declare const toggleJobStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Get job statistics (admin only)
 */
export declare const getJobStats: (req: Request, res: Response) => Promise<void>;
/**
 * Search jobs with advanced filters
 */
export declare const searchJobs: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=jobController.d.ts.map