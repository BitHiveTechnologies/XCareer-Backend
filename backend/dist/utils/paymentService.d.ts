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
    customer?: {
        customerId?: string;
        name?: string;
        email?: string;
        phone?: string;
    };
    returnUrl?: string;
    notifyUrl?: string;
    notes?: Record<string, any>;
}
export interface CashfreeOrderResponse {
    cfOrderId?: string;
    orderId: string;
    paymentSessionId: string;
    currency: string;
    amount: number;
    status: string;
    orderMeta?: {
        return_url?: string;
        notify_url?: string;
    };
    customerDetails?: Record<string, any>;
    createdAt?: string;
}
export interface CashfreePaymentRecord {
    cf_payment_id?: string;
    payment_status?: string;
    payment_amount?: number;
    payment_currency?: string;
    payment_message?: string;
    payment_time?: string;
    bank_reference?: string;
    auth_id?: string | null;
}
export interface WebhookVerificationResult {
    valid: boolean;
    reason?: string;
}
export declare const SUBSCRIPTION_PLANS: Record<string, PaymentPlan>;
/**
 * Create a new Cashfree order
 */
export declare const createCashfreeOrder: (options: CreateOrderOptions) => Promise<{
    success: boolean;
    order: {
        orderId: any;
        cfOrderId: any;
        paymentSessionId: any;
        amount: any;
        currency: any;
        status: any;
        orderMeta: any;
        customerDetails: any;
        createdAt: any;
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    order?: undefined;
}>;
/**
 * Fetch a Cashfree order by order ID
 */
export declare const fetchCashfreeOrder: (orderId: string) => Promise<{
    success: boolean;
    order: any;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    order?: undefined;
}>;
/**
 * Fetch payments for a Cashfree order
 */
export declare const fetchCashfreeOrderPayments: (orderId: string) => Promise<{
    success: boolean;
    payments: any;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    payments?: undefined;
}>;
/**
 * Verify webhook signature using the Cashfree webhook secret.
 * Cashfree webhook docs use raw payload plus timestamp headers.
 */
export declare const verifyCashfreeWebhookSignature: (rawBody: string, signature: string | undefined, timestamp: string | undefined) => WebhookVerificationResult;
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
 * Handle payment failure - retained for compatibility with existing callers.
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
 * Refunds are not part of the first Cashfree migration pass.
 */
export declare const processRefund: (_paymentId: string, _amount: number, _reason: string) => Promise<{
    success: boolean;
    error: string;
}>;
//# sourceMappingURL=paymentService.d.ts.map