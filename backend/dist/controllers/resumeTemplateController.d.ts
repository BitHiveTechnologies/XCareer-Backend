import { Request, Response } from 'express';
/**
 * Get all resume templates with filtering
 */
export declare const getAllTemplates: (req: Request, res: Response) => Promise<void>;
/**
 * Get a specific template by ID
 */
export declare const getTemplateById: (req: Request, res: Response) => Promise<void>;
/**
 * Download a template (increment download count)
 */
export declare const downloadTemplate: (req: Request, res: Response) => Promise<void>;
/**
 * Rate a template
 */
export declare const rateTemplate: (req: Request, res: Response) => Promise<void>;
/**
 * Get popular templates
 */
export declare const getPopularTemplates: (req: Request, res: Response) => Promise<void>;
/**
 * Get templates by category
 */
export declare const getTemplatesByCategory: (req: Request, res: Response) => Promise<void>;
/**
 * Get templates by industry
 */
export declare const getTemplatesByIndustry: (req: Request, res: Response) => Promise<void>;
/**
 * Get templates by experience level
 */
export declare const getTemplatesByExperienceLevel: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=resumeTemplateController.d.ts.map