import { Request, Response } from 'express';
export declare const createOrder: (req: Request, res: Response) => Promise<void>;
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentStatus: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentHistory: (req: Request, res: Response) => Promise<void>;
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map