export interface PaymentPlan {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    maxJobs: number;
    priority: 'low' | 'medium' | 'high';
}
export interface CreateOrderOptions {
    userId: string;
    plan: string;
    amount: number;
    currency?: string;
    notes?: Record<string, any>;
}
export interface PaymentVerificationData {
    orderId: string;
    paymentId: string;
    signature: string;
}
export interface SubscriptionDetails {
    plan: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    amount: number;
}
export declare const SUBSCRIPTION_PLANS: Record<string, PaymentPlan>;
/**
 * Create a new Razorpay order
 */
export declare const createRazorpayOrder: (options: CreateOrderOptions) => Promise<{
    success: boolean;
    order: {
        id: string;
        amount: string | number;
        currency: string;
        receipt: string;
        status: "created" | "attempted" | "paid";
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    order?: undefined;
}>;
/**
 * Verify payment signature
 */
export declare const verifyPaymentSignature: (data: PaymentVerificationData) => boolean;
/**
 * Fetch payment details from Razorpay
 */
export declare const fetchPaymentDetails: (paymentId: string) => Promise<{
    success: boolean;
    payment: import("razorpay/dist/types/payments").Payments.RazorpayPayment;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    payment?: undefined;
}>;
/**
 * Calculate subscription end date based on plan
 */
export declare const calculateSubscriptionEndDate: (plan: string, startDate?: Date) => Date;
/**
 * Get plan details by ID
 */
export declare const getPlanDetails: (planId: string) => PaymentPlan | null;
/**
 * Get all available plans
 */
export declare const getAllPlans: () => PaymentPlan[];
/**
 * Validate subscription plan
 */
export declare const validateSubscriptionPlan: (plan: string) => boolean;
/**
 * Calculate plan price in different currencies
 */
export declare const getPlanPrice: (planId: string, currency?: string) => number;
/**
 * Generate payment receipt
 */
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
/**
 * Handle payment failure
 */
export declare const handlePaymentFailure: (orderId: string, reason: string) => Promise<{
    success: boolean;
    message: string;
    orderId: string;
    reason: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
    orderId?: undefined;
    reason?: undefined;
}>;
/**
 * Process refund
 */
export declare const processRefund: (paymentId: string, amount: number, reason: string) => Promise<{
    success: boolean;
    refund: {
        id: string;
        paymentId: string;
        amount: number;
        status: "pending" | "failed" | "processed";
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    refund?: undefined;
}>;
//# sourceMappingURL=paymentService.d.ts.map