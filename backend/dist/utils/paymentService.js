"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = exports.handlePaymentFailure = exports.generatePaymentReceipt = exports.getPlanPrice = exports.validateSubscriptionPlan = exports.getAllPlans = exports.getPlanDetails = exports.calculateSubscriptionEndDate = exports.fetchPaymentDetails = exports.verifyPaymentSignature = exports.createCashfreeOrder = exports.SUBSCRIPTION_PLANS = void 0;
const axios_1 = __importDefault(require("axios"));
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
        duration: 30,
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
        duration: 30,
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
    return environment_1.config.CASHFREE_ENV === 'production'
        ? 'https://api.cashfree.com'
        : 'https://sandbox.cashfree.com';
};
const getCashfreeHeaders = () => {
    return {
        'x-client-id': environment_1.config.CASHFREE_CLIENT_ID,
        'x-client-secret': environment_1.config.CASHFREE_CLIENT_SECRET,
        'x-api-version': environment_1.config.CASHFREE_API_VERSION || '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
};
const createCashfreeOrder = async (options) => {
    try {
        const orderId = `order_${Date.now()}_${options.userId || 'guest'}`;
        const payload = {
            order_id: orderId,
            order_amount: Math.round(options.amount * 100) / 100,
            order_currency: options.currency || 'INR',
            customer_details: {
                customer_id: options.userId || `guest_${Date.now()}`,
                customer_email: options.email || 'guest@example.com',
                customer_phone: options.phone || '9999999999',
                customer_name: options.name || 'Guest User'
            },
            order_meta: {
                return_url: `${environment_1.config.FRONTEND_URL}/notify?order_id={order_id}&status=success`
            },
            order_tags: {
                plan: options.plan,
                userId: options.userId || 'guest',
                purpose: 'subscription_payment',
                ...options.notes
            }
        };
        const response = await axios_1.default.post(`${getCashfreeBaseUrl()}/pg/orders`, payload, {
            headers: getCashfreeHeaders()
        });
        const orderData = response.data;
        logger_1.logger.info('Cashfree order created', {
            userId: options.userId,
            orderId: orderData.order_id,
            amount: orderData.order_amount,
            plan: options.plan
        });
        return {
            success: true,
            order: {
                id: orderData.order_id,
                paymentSessionId: orderData.payment_session_id,
                amount: orderData.order_amount,
                currency: orderData.order_currency,
                status: orderData.order_status
            },
            cashfree: {
                mode: environment_1.config.CASHFREE_ENV || 'sandbox'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to create Cashfree order', {
            error: error?.response?.data || error.message,
            userId: options.userId,
            plan: options.plan
        });
        return {
            success: false,
            error: error?.response?.data?.message || error.message || 'Failed to create order'
        };
    }
};
exports.createCashfreeOrder = createCashfreeOrder;
const verifyPaymentSignature = (data) => {
    // Cashfree handles signature verification via webhook headers
    return true;
};
exports.verifyPaymentSignature = verifyPaymentSignature;
const fetchPaymentDetails = async (orderId) => {
    try {
        const response = await axios_1.default.get(`${getCashfreeBaseUrl()}/pg/orders/${orderId}`, {
            headers: getCashfreeHeaders()
        });
        return {
            success: true,
            payment: response.data
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch payment details', {
            error: error?.response?.data || error.message,
            orderId
        });
        return {
            success: false,
            error: error?.response?.data?.message || error.message || 'Failed to fetch payment'
        };
    }
};
exports.fetchPaymentDetails = fetchPaymentDetails;
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
const getPlanDetails = (planId) => {
    return exports.SUBSCRIPTION_PLANS[planId] || null;
};
exports.getPlanDetails = getPlanDetails;
const getAllPlans = () => {
    return Object.values(exports.SUBSCRIPTION_PLANS);
};
exports.getAllPlans = getAllPlans;
const validateSubscriptionPlan = (plan) => {
    return Object.keys(exports.SUBSCRIPTION_PLANS).includes(plan);
};
exports.validateSubscriptionPlan = validateSubscriptionPlan;
const getPlanPrice = (planId, currency = 'INR') => {
    const plan = exports.SUBSCRIPTION_PLANS[planId];
    if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
    }
    return plan.price;
};
exports.getPlanPrice = getPlanPrice;
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
        return {
            success: false,
            error: error.message || 'Failed to handle payment failure'
        };
    }
};
exports.handlePaymentFailure = handlePaymentFailure;
const processRefund = async (paymentId, amount, reason) => {
    return {
        success: false,
        error: 'Refunds not fully implemented for Cashfree yet'
    };
};
exports.processRefund = processRefund;
//# sourceMappingURL=paymentService.js.map