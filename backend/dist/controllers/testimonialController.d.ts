import { Request, Response } from 'express';
/**
 * Get all approved testimonials
 */
export declare const getApprovedTestimonials: (req: Request, res: Response) => Promise<void>;
/**
 * Submit a new testimonial
 */
export declare const submitTestimonial: (req: Request, res: Response) => Promise<void>;
/**
 * Admin: Get all testimonials (for moderation)
 */
export declare const getAllTestimonials: (req: Request, res: Response) => Promise<void>;
/**
 * Admin: Approve/Reject testimonial
 */
export declare const moderateTestimonial: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=testimonialController.d.ts.map