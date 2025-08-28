import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from './logger';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET
});

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
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

// Available subscription plans
export const SUBSCRIPTION_PLANS: Record<string, PaymentPlan> = {
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
export const createRazorpayOrder = async (options: CreateOrderOptions) => {
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
    
    logger.info('Razorpay order created', {
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
  } catch (error) {
    logger.error('Failed to create Razorpay order', {
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

/**
 * Verify payment signature
 */
export const verifyPaymentSignature = (data: PaymentVerificationData): boolean => {
  try {
    const text = `${data.orderId}|${data.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return expectedSignature === data.signature;
  } catch (error) {
    logger.error('Payment signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: data.orderId,
      paymentId: data.paymentId
    });
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 */
export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    logger.error('Failed to fetch payment details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment'
    };
  }
};

/**
 * Calculate subscription end date based on plan
 */
export const calculateSubscriptionEndDate = (plan: string, startDate: Date = new Date()): Date => {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  if (!planDetails) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + planDetails.duration);
  return endDate;
};

/**
 * Get plan details by ID
 */
export const getPlanDetails = (planId: string): PaymentPlan | null => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

/**
 * Get all available plans
 */
export const getAllPlans = (): PaymentPlan[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

/**
 * Validate subscription plan
 */
export const validateSubscriptionPlan = (plan: string): boolean => {
  return Object.keys(SUBSCRIPTION_PLANS).includes(plan);
};

/**
 * Calculate plan price in different currencies
 */
export const getPlanPrice = (planId: string, currency: string = 'INR'): number => {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  // Simple currency conversion (in production, use real-time rates)
  const conversionRates: Record<string, number> = {
    'INR': 1,
    'USD': 0.012, // 1 INR = 0.012 USD (approximate)
    'EUR': 0.011  // 1 INR = 0.011 EUR (approximate)
  };

  const rate = conversionRates[currency] || 1;
  return Math.round(plan.price * rate * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate payment receipt
 */
export const generatePaymentReceipt = (paymentData: {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  plan: string;
  userId: string;
}) => {
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

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (orderId: string, reason: string) => {
  try {
    logger.warn('Payment failed', {
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
  } catch (error) {
    logger.error('Failed to handle payment failure', {
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

/**
 * Process refund
 */
export const processRefund = async (paymentId: string, amount: number, reason: string) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      notes: {
        reason
      }
    });

    logger.info('Refund processed successfully', {
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
  } catch (error) {
    logger.error('Failed to process refund', {
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
