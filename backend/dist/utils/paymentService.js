"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = exports.handlePaymentFailure = exports.generatePaymentReceipt = exports.getPlanPrice = exports.validateSubscriptionPlan = exports.getAllPlans = exports.getPlanDetails = exports.calculateSubscriptionEndDate = exports.fetchPaymentDetails = exports.verifyPaymentSignature = exports.createRazorpayOrder = exports.SUBSCRIPTION_PLANS = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const environment_1 = require("../config/environment");
const logger_1 = require("./logger");
// Initialize Razorpay
const razorpay = new razorpay_1.default({
    key_id: environment_1.config.RAZORPAY_KEY_ID,
    key_secret: environment_1.config.RAZORPAY_KEY_SECRET
});
// Available subscription plans
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
/**
 * Create a new Razorpay order
 */
const createRazorpayOrder = async (options) => {
    try {
        const orderOptions = {
            amount: Math.round(options.amount * 100), // Convert to paise
            currency: options.currency || 'INR',
            receipt: `order_${Date.now()}_${options.userId}`,
            notes: {
                userId: options.userId,
                plan: options.plan,
                purpose: 'subscription_payment',
                ...options.notes
            }
        };
        const order = await razorpay.orders.create(orderOptions);
        logger_1.logger.info('Razorpay order created', {
            userId: options.userId,
            orderId: order.id,
            amount: options.amount,
            plan: options.plan
        });
        return {
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to create Razorpay order', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: options.userId,
            plan: options.plan
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create order'
        };
    }
};
exports.createRazorpayOrder = createRazorpayOrder;
/**
 * Verify payment signature
 */
const verifyPaymentSignature = (data) => {
    try {
        const text = `${data.orderId}|${data.paymentId}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', environment_1.config.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');
        return expectedSignature === data.signature;
    }
    catch (error) {
        logger_1.logger.error('Payment signature verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orderId: data.orderId,
            paymentId: data.paymentId
        });
        return false;
    }
};
exports.verifyPaymentSignature = verifyPaymentSignature;
/**
 * Fetch payment details from Razorpay
 */
const fetchPaymentDetails = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            success: true,
            payment
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch payment details', {
            error: error instanceof Error ? error.message : 'Unknown error',
            paymentId
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch payment'
        };
    }
};
exports.fetchPaymentDetails = fetchPaymentDetails;
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
    // Simple currency conversion (in production, use real-time rates)
    const conversionRates = {
        'INR': 1,
        'USD': 0.012, // 1 INR = 0.012 USD (approximate)
        'EUR': 0.011 // 1 INR = 0.011 EUR (approximate)
    };
    const rate = conversionRates[currency] || 1;
    return Math.round(plan.price * rate * 100) / 100; // Round to 2 decimal places
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
 * Handle payment failure
 */
const handlePaymentFailure = async (orderId, reason) => {
    try {
        logger_1.logger.warn('Payment failed', {
            orderId,
            reason,
            timestamp: new Date().toISOString()
        });
        // In a real application, you might want to:
        // 1. Update order status in database
        // 2. Send failure notification to user
        // 3. Log failure for analytics
        // 4. Trigger retry mechanism
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
 * Process refund
 */
const processRefund = async (paymentId, amount, reason) => {
    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount: Math.round(amount * 100), // Convert to paise
            notes: {
                reason
            }
        });
        logger_1.logger.info('Refund processed successfully', {
            paymentId,
            refundId: refund.id,
            amount,
            reason
        });
        return {
            success: true,
            refund: {
                id: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount,
                status: refund.status
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to process refund', {
            error: error instanceof Error ? error.message : 'Unknown error',
            paymentId,
            amount,
            reason
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process refund'
        };
    }
};
exports.processRefund = processRefund;
//# sourceMappingURL=paymentService.js.map