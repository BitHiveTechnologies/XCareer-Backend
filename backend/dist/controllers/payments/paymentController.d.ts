import { Request, Response } from 'express';
/**
 * Create a new payment order
 */
export declare const createOrder: (req: Request, res: Response) => Promise<void>;
/**
 * Verify payment and create subscription
 */
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
/**
 * Get payment history for a user
 */
export declare const getPaymentHistory: (req: Request, res: Response) => Promise<void>;
/**
 * Handle Razorpay webhook for subscription events
 */
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
/**
 * Get payment status by subscription ID
 */
export declare const getPaymentStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Cancel subscription
 */
export declare const cancelSubscription: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map