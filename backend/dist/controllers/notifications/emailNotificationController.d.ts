import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId: string;
        metadata?: Record<string, any>;
    };
}
/**
 * Send welcome email to new user
 */
export declare const sendWelcomeEmail: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Send job alert email to user
 */
export declare const sendJobAlertEmail: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get email queue status
 */
export declare const getEmailQueueStatus: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Test email service connection
 */
export declare const testEmailConnection: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=emailNotificationController.d.ts.map