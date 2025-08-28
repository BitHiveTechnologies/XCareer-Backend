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
 * Handle Razorpay webhook
 */
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map