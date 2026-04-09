"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = exports.handlePaymentFailure = exports.generatePaymentReceipt = exports.getPlanPrice = exports.validateSubscriptionPlan = exports.getAllPlans = exports.getPlanDetails = exports.calculateSubscriptionEndDate = exports.verifyCashfreeWebhookSignature = exports.fetchCashfreeOrderPayments = exports.fetchCashfreeOrder = exports.createCashfreeOrder = exports.SUBSCRIPTION_PLANS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const environment_1 = require("../config/environment");
const logger_1 = require("./logger");
exports.SUBSCRIPTION_PLANS = {
    basic: {
        id: 'basic',
        name: 'Basic Plan',
        price: 49,
        duration: 30,
        features: [
            'Access to basic job listings',
            'Email notifications',
            'Basic profile management'
        ],
        maxJobs: 50,
        priority: 'low'
    },
    premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: 99,
        duration: 90,
        features: [
            'All Basic features',
            'Priority job matching',
            'Advanced analytics',
            'Resume builder tools'
        ],
        maxJobs: 200,
        priority: 'medium'
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 299,
        duration: 365,
        features: [
            'All Premium features',
            'Custom integrations',
            'Dedicated support',
            'Advanced reporting',
            'Team management'
        ],
        maxJobs: 1000,
        priority: 'high'
    }
};
const getCashfreeBaseUrl = () => {
    if (environment_1.config.CASHFREE_ENV === 'production') {
        return 'https://api.cashfree.com';
    }
    return 'https://sandbox.cashfree.com';
};
const getCashfreeHeaders = () => ({
    'Content-Type': 'application/json',
    'x-client-id': environment_1.config.CASHFREE_CLIENT_ID,
    'x-client-secret': environment_1.config.CASHFREE_CLIENT_SECRET,
    'x-api-version': environment_1.config.CASHFREE_API_VERSION,
});
const buildOrderId = (userId) => {
    return `cf_${userId}_${Date.now()}`;
};
/**
 * Create a new Cashfree order
 */
const createCashfreeOrder = async (options) => {
    try {
        const orderId = buildOrderId(options.userId);
        const payload = {
            order_id: orderId,
            order_amount: Number(options.amount),
            order_currency: options.currency || 'INR',
            customer_details: {
                customer_id: options.customer?.customerId || options.userId,
                customer_name: options.customer?.name || 'CareerX User',
                customer_email: options.customer?.email || undefined,
                customer_phone: options.customer?.phone || '9999999999'
            },
            order_note: options.notes?.['orderNote'] || `Subscription payment for ${options.plan}`,
            order_meta: {
                ...(options.returnUrl ? { return_url: options.returnUrl } : {}),
                ...(options.notifyUrl ? { notify_url: options.notifyUrl } : {})
            },
            order_tags: {
                userId: options.userId,
                plan: options.plan,
                purpose: 'subscription_payment',
                ...options.notes
            }
        };
        const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders`, {
            method: 'POST',
            headers: getCashfreeHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.message || data?.error || `Cashfree order creation failed (${response.status})`);
        }
        logger_1.logger.info('Cashfree order created', {
            userId: options.userId,
            orderId: data.order_id || orderId,
            cfOrderId: data.cf_order_id,
            amount: options.amount,
            plan: options.plan,
            environment: environment_1.config.CASHFREE_ENV
        });
        return {
            success: true,
            order: {
                orderId: data.order_id || orderId,
                cfOrderId: data.cf_order_id,
                paymentSessionId: data.payment_session_id,
                amount: data.order_amount ?? options.amount,
                currency: data.order_currency ?? options.currency ?? 'INR',
                status: data.order_status ?? 'ACTIVE',
                orderMeta: data.order_meta,
                customerDetails: data.customer_details,
                createdAt: data.created_at
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to create Cashfree order', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: options.userId,
            plan: options.plan,
            environment: environment_1.config.CASHFREE_ENV
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create order'
        };
    }
};
exports.createCashfreeOrder = createCashfreeOrder;
/**
 * Fetch a Cashfree order by order ID
 */
const fetchCashfreeOrder = async (orderId) => {
    try {
        const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: getCashfreeHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.message || data?.error || `Failed to fetch Cashfree order (${response.status})`);
        }
        return {
            success: true,
            order: data
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch Cashfree order', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orderId
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch order'
        };
    }
};
exports.fetchCashfreeOrder = fetchCashfreeOrder;
/**
 * Fetch payments for a Cashfree order
 */
const fetchCashfreeOrderPayments = async (orderId) => {
    try {
        const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
            method: 'GET',
            headers: getCashfreeHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.message || data?.error || `Failed to fetch order payments (${response.status})`);
        }
        return {
            success: true,
            payments: Array.isArray(data) ? data : data?.payments || []
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch Cashfree order payments', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orderId
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch payments'
        };
    }
};
exports.fetchCashfreeOrderPayments = fetchCashfreeOrderPayments;
/**
 * Verify webhook signature using the Cashfree webhook secret.
 * Cashfree webhook docs use raw payload plus timestamp headers.
 */
const verifyCashfreeWebhookSignature = (rawBody, signature, timestamp) => {
    if (!signature) {
        return { valid: false, reason: 'Webhook signature missing' };
    }
    if (!timestamp) {
        return { valid: false, reason: 'Webhook timestamp missing' };
    }
    const secret = environment_1.config.CASHFREE_WEBHOOK_SECRET;
    if (!secret) {
        return { valid: false, reason: 'Webhook secret not configured' };
    }
    const candidates = [
        `${timestamp}.${rawBody}`,
        `${timestamp}${rawBody}`,
        rawBody,
    ];
    for (const payload of candidates) {
        const expected = crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('base64');
        if (expected === signature) {
            return { valid: true };
        }
    }
    return { valid: false, reason: 'Invalid webhook signature' };
};
exports.verifyCashfreeWebhookSignature = verifyCashfreeWebhookSignature;
/**
 * Calculate subscription end date based on plan
 */
const calculateSubscriptionEndDate = (plan, startDate = new Date()) => {
    const planDetails = exports.SUBSCRIPTION_PLANS[plan];
    if (!planDetails) {
        throw new Error(`Invalid plan: ${plan}`);
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDetails.duration);
    return endDate;
};
exports.calculateSubscriptionEndDate = calculateSubscriptionEndDate;
/**
 * Get plan details by ID
 */
const getPlanDetails = (planId) => {
    return exports.SUBSCRIPTION_PLANS[planId] || null;
};
exports.getPlanDetails = getPlanDetails;
/**
 * Get all available plans
 */
const getAllPlans = () => {
    return Object.values(exports.SUBSCRIPTION_PLANS);
};
exports.getAllPlans = getAllPlans;
/**
 * Validate subscription plan
 */
const validateSubscriptionPlan = (plan) => {
    return Object.keys(exports.SUBSCRIPTION_PLANS).includes(plan);
};
exports.validateSubscriptionPlan = validateSubscriptionPlan;
/**
 * Calculate plan price in different currencies
 */
const getPlanPrice = (planId, currency = 'INR') => {
    const plan = exports.SUBSCRIPTION_PLANS[planId];
    if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
    }
    const conversionRates = {
        INR: 1,
        USD: 0.012,
        EUR: 0.011
    };
    const rate = conversionRates[currency] || 1;
    return Math.round(plan.price * rate * 100) / 100;
};
exports.getPlanPrice = getPlanPrice;
/**
 * Generate payment receipt
 */
const generatePaymentReceipt = (paymentData) => {
    return {
        receiptNumber: `RCP-${Date.now()}`,
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        plan: paymentData.plan,
        userId: paymentData.userId,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };
};
exports.generatePaymentReceipt = generatePaymentReceipt;
/**
 * Handle payment failure - retained for compatibility with existing callers.
 */
const handlePaymentFailure = async (orderId, reason) => {
    try {
        logger_1.logger.warn('Payment failed', {
            orderId,
            reason,
            timestamp: new Date().toISOString()
        });
        return {
            success: true,
            message: 'Payment failure handled',
            orderId,
            reason
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to handle payment failure', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orderId,
            reason
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to handle payment failure'
        };
    }
};
exports.handlePaymentFailure = handlePaymentFailure;
/**
 * Refunds are not part of the first Cashfree migration pass.
 */
const processRefund = async (_paymentId, _amount, _reason) => {
    return {
        success: false,
        error: 'Refund processing is not implemented for the Cashfree migration yet'
    };
};
exports.processRefund = processRefund;
//# sourceMappingURL=paymentService.js.map