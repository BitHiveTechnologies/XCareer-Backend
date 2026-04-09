import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from './logger';

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

const getCashfreeBaseUrl = (): string => {
  if (config.CASHFREE_ENV === 'production') {
    return 'https://api.cashfree.com';
  }
  return 'https://sandbox.cashfree.com';
};

const getCashfreeHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-client-id': config.CASHFREE_CLIENT_ID,
  'x-client-secret': config.CASHFREE_CLIENT_SECRET,
  'x-api-version': config.CASHFREE_API_VERSION,
});

const buildOrderId = (userId: string): string => {
  return `cf_${userId}_${Date.now()}`;
};

/**
 * Create a new Cashfree order
 */
export const createCashfreeOrder = async (options: CreateOrderOptions) => {
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

    const data: any = await response.json();

    if (!response.ok) {
      logger.error('Cashfree order creation API error', {
        status: response.status,
        data,
        environment: config.CASHFREE_ENV
      });
      throw new Error(data?.message || data?.error || `Cashfree order creation failed (${response.status})`);
    }

    logger.info('Cashfree order created', {
      userId: options.userId,
      orderId: data.order_id || orderId,
      cfOrderId: data.cf_order_id,
      amount: options.amount,
      plan: options.plan,
      environment: config.CASHFREE_ENV
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
      } satisfies CashfreeOrderResponse
    };
  } catch (error) {
    logger.error('Failed to create Cashfree order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: options.userId,
      plan: options.plan,
      environment: config.CASHFREE_ENV
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
};

/**
 * Fetch a Cashfree order by order ID
 */
export const fetchCashfreeOrder = async (orderId: string) => {
  try {
    const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: getCashfreeHeaders()
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Failed to fetch Cashfree order (${response.status})`);
    }

    return {
      success: true,
      order: data
    };
  } catch (error) {
    logger.error('Failed to fetch Cashfree order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order'
    };
  }
};

/**
 * Fetch payments for a Cashfree order
 */
export const fetchCashfreeOrderPayments = async (orderId: string) => {
  try {
    const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
      method: 'GET',
      headers: getCashfreeHeaders()
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Failed to fetch order payments (${response.status})`);
    }

    return {
      success: true,
      payments: Array.isArray(data) ? data : data?.payments || []
    };
  } catch (error) {
    logger.error('Failed to fetch Cashfree order payments', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payments'
    };
  }
};

/**
 * Verify webhook signature using the Cashfree webhook secret.
 * Cashfree webhook docs use raw payload plus timestamp headers.
 */
export const verifyCashfreeWebhookSignature = (
  rawBody: string,
  signature: string | undefined,
  timestamp: string | undefined
): WebhookVerificationResult => {
  if (!signature) {
    return { valid: false, reason: 'Webhook signature missing' };
  }

  if (!timestamp) {
    return { valid: false, reason: 'Webhook timestamp missing' };
  }

  const secret = config.CASHFREE_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: false, reason: 'Webhook secret not configured' };
  }

  const candidates = [
    `${timestamp}.${rawBody}`,
    `${timestamp}${rawBody}`,
    rawBody,
  ];

  for (const payload of candidates) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    if (expected === signature) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'Invalid webhook signature' };
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

  const conversionRates: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011
  };

  const rate = conversionRates[currency] || 1;
  return Math.round(plan.price * rate * 100) / 100;
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
 * Handle payment failure - retained for compatibility with existing callers.
 */
export const handlePaymentFailure = async (orderId: string, reason: string) => {
  try {
    logger.warn('Payment failed', {
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
 * Refunds are not part of the first Cashfree migration pass.
 */
export const processRefund = async (_paymentId: string, _amount: number, _reason: string) => {
  return {
    success: false,
    error: 'Refund processing is not implemented for the Cashfree migration yet'
  };
};
