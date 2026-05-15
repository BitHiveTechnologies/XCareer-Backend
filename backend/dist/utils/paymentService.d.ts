import { Plan as PaymentPlan } from '../config/plans';
export interface CreateOrderOptions {
    userId: string;
    plan: string;
    amount: number;
    currency?: string;
    notes?: Record<string, any>;
    email?: string;
    name?: string;
    phone?: string;
}
export interface PaymentVerificationData {
    orderId: string;
    paymentId?: string;
    signature?: string;
}
export interface SubscriptionDetails {
    plan: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    amount: number;
}
export declare const SUBSCRIPTION_PLANS: Record<string, PaymentPlan>;
export declare const createCashfreeOrder: (options: CreateOrderOptions) => Promise<{
    success: boolean;
    order: {
        id: any;
        paymentSessionId: any;
        amount: any;
        currency: any;
        status: any;
    };
    cashfree: {
        mode: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    order?: undefined;
    cashfree?: undefined;
}>;
export declare const verifyPaymentSignature: (data: PaymentVerificationData) => boolean;
export declare const fetchPaymentDetails: (orderId: string) => Promise<{
    success: boolean;
    payment: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    payment?: undefined;
}>;
export declare const calculateSubscriptionEndDate: (plan: string, startDate?: Date) => Date;
export declare const getPlanDetails: (planId: string) => PaymentPlan | null;
export declare const getAllPlans: () => PaymentPlan[];
export declare const validateSubscriptionPlan: (plan: string) => boolean;
export declare const getPlanPrice: (planId: string, currency?: string) => number;
export declare const generatePaymentReceipt: (paymentData: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    plan: string;
    userId: string;
}) => {
    receiptNumber: string;
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    plan: string;
    userId: string;
    timestamp: string;
    status: string;
};
export declare const handlePaymentFailure: (orderId: string, reason: string) => Promise<{
    success: boolean;
    message: string;
    orderId: string;
    reason: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    message?: undefined;
    orderId?: undefined;
    reason?: undefined;
}>;
export declare const processRefund: (paymentId: string, amount: number, reason: string) => Promise<{
    success: boolean;
    error: string;
}>;
//# sourceMappingURL=paymentService.d.ts.map