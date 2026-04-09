import { Request, Response } from 'express';
interface CashfreeRequest extends Request {
    rawBody?: string;
}
export declare const createOrder: (req: Request, res: Response) => Promise<void>;
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentHistory: (req: Request, res: Response) => Promise<void>;
export declare const handleWebhook: (req: CashfreeRequest, res: Response) => Promise<void>;
export declare const getPaymentStatus: (req: Request, res: Response) => Promise<void>;
export declare const cancelSubscription: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=paymentController.d.ts.map