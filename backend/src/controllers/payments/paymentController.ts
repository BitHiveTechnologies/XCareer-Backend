import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { Customer } from '../../models/Customer';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';
import { createCashfreeOrder, fetchPaymentDetails, calculateSubscriptionEndDate } from '../../utils/paymentService';
import { emailService } from '../../utils/emailService';
import { generateToken, generateRefreshToken } from '../../utils/jwt';
import { PLANS } from '../../config/plans';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, amount, currency = 'INR', email, name } = req.body;
    const userId = req.user?.id;
    let userEmail = email || req.user?.email;

    // Prevent duplicate subscriptions
    if (userEmail) {
      const existingUser = await User.findOne({ email: userEmail });
      if (existingUser) {
        const activeSub = await Subscription.findOne({
          userId: existingUser._id,
          status: 'completed',
          endDate: { $gt: new Date() }
        });

        if (activeSub) {
          // If the user is trying to buy the SAME plan they already have active
          if (activeSub.plan === plan) {
            res.status(400).json({
              success: false,
              error: { 
                message: `An active ${activeSub.plan} subscription already exists for this email. You cannot purchase the same plan while it is active.` 
              },
              timestamp: new Date().toISOString()
            });
            return;
          }
          
          // If they are buying a different plan (upgrade or downgrade), we allow it
          logger.info('User is changing subscription plan', {
            userId: existingUser._id,
            from: activeSub.plan,
            to: plan
          });
        }
      }
    }

    if (!userId && !email) {
      res.status(400).json({
        success: false,
        error: { message: 'Authentication or email required for guest checkout' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid email address format' },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    const planConfig = PLANS[plan.toLowerCase() === 'pro' ? 'enterprise' : plan.toLowerCase()];
    if (!planConfig) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid subscription plan. Valid plans: basic, premium, pro' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Force the correct amount from backend config
    const validatedAmount = planConfig.price;

    let userName = name;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userEmail = user.email;
        userName = user.name;
      }
    }

    const orderResponse = await createCashfreeOrder({
      userId: userId || '',
      plan,
      amount: validatedAmount,
      currency,
      email: userEmail,
      name: userName
    });

    if (!orderResponse.success) {
      res.status(500).json({
        success: false,
        error: { message: orderResponse.error || 'Failed to create order' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create order failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: { message: 'Failed to create order' },
      timestamp: new Date().toISOString()
    });
  }
};

/** createOrder tags guest checkouts as the literal string 'guest', which is not an id. */
const isLookupableUserId = (value: unknown): string | undefined =>
  typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value) ? value : undefined;

/**
 * Activate a paid subscription and send the customer their emails.
 *
 * Shared by verifyPayment (browser returns from Cashfree) and handleWebhook
 * (server-to-server). Whichever arrives first does the work; the other finds the
 * order already completed and becomes a no-op. Before this existed only
 * verifyPayment could activate, so a customer who closed the tab paid and got
 * nothing — no subscription, no credentials email, no way to log in.
 */
const activatePaidSubscription = async (params: {
  orderId: string;
  paymentId: string;
  email?: string;
  name?: string;
  plan: string;
  amount: number;
  authUserId?: string;
}): Promise<{ user: any; subscription: any; isNewUser: boolean } | null> => {
  const { orderId, paymentId, email, name, plan, amount, authUserId } = params;

  // Idempotency across both callers: one completed order, one activation.
  const alreadyDone = await Subscription.findOne({ orderId, status: 'completed' });
  if (alreadyDone) {
    logger.info('Subscription already activated for order — skipping', { orderId });
    return null;
  }

  let user = null;
  let isNewUser = false;
  let tempPassword = '';

  if (authUserId) {
    user = await User.findById(authUserId);
  }
  if (!user && email) {
    user = await User.findOne({ email });
  }
  if (!user && email) {
    // Create guest user. The generated password is delivered to the user
    // via the credentials email below — never log it or write it to disk.
    tempPassword = Math.random().toString(36).slice(-8) + 'X!';
    user = new User({
      email,
      name: name || 'User',
      password: tempPassword,
      role: 'user',
      mustChangePassword: true
    });
    await user.save();
    isNewUser = true;
  }
  if (!user) return null;

  const userId = user._id;
  const planValue = plan as 'basic' | 'premium' | 'enterprise';
  const now = new Date();
  const endDate = calculateSubscriptionEndDate(plan, now);

  let subscription = await Subscription.findOne({ userId });
  if (subscription) {
    subscription.plan = planValue;
    subscription.amount = amount;
    subscription.paymentId = paymentId;
    subscription.orderId = orderId;
    subscription.status = 'completed';
    subscription.startDate = now;
    subscription.endDate = endDate;
    subscription.updatedAt = now;
  } else {
    subscription = new Subscription({
      userId,
      plan: planValue,
      amount,
      paymentId,
      orderId,
      status: 'completed',
      startDate: now,
      endDate
    });
  }
  await subscription.save();

  await User.findByIdAndUpdate(userId, {
    subscriptionPlan: plan,
    subscriptionStatus: 'active',
    subscriptionStartDate: now,
    subscriptionEndDate: endDate
  });

  try {
    await Customer.findOneAndUpdate(
      { userId },
      {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        $inc: { totalPaid: amount, subscriptionCount: 1 },
        lastSubscriptionDate: now,
        status: 'active'
      },
      { upsert: true, new: true }
    );
  } catch (customerError) {
    logger.error('Failed to update customer record', { error: customerError, userId });
  }

  const planDisplayName = plan === 'enterprise' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1);
  await emailService.sendEmail({
    to: user.email,
    subject: `Your CareerX ${planDisplayName} Subscription is Active!`,
    template: 'subscription-confirmation',
    context: {
      plan: planDisplayName,
      amount,
      endDate: endDate.toDateString()
    }
  }).catch(err => logger.error('Failed to send confirmation email', { error: err }));

  if (isNewUser) {
    await emailService.sendSubscriptionWelcomeCredentialsEmail(
      user.email,
      user.name,
      tempPassword,
      plan
    ).catch(err => logger.error('Failed to send credentials email', { error: err }));
  }

  return { user, subscription, isNewUser };
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const authUserId = req.user?.id;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: { message: 'Order ID is required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check for replay attack - is this order already processed?
    const existingSubscription = await Subscription.findOne({ orderId, status: 'completed' });
    if (existingSubscription) {
      res.status(400).json({
        success: false,
        error: { message: 'This order has already been processed' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const paymentResult = await fetchPaymentDetails(orderId);
    if (!paymentResult.success || !paymentResult.payment) {
      res.status(400).json({
        success: false,
        error: { message: 'Payment not found or failed to fetch' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const payment = paymentResult.payment;
    if (payment.order_status !== 'PAID') {
      res.status(400).json({
        success: false,
        error: { message: 'Payment not completed' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const email = payment.customer_details?.customer_email;
    const tags = payment.order_tags || {};
    // Normalize plan: 'pro' is the UI alias for 'enterprise' (DB value)
    const rawPlan = tags.plan || 'premium';
    const plan = rawPlan.toLowerCase() === 'pro' ? 'enterprise' : rawPlan.toLowerCase();
    const amount = payment.order_amount;
    const paymentId = payment.payment_session_id || orderId; // or appropriate payment ID

    const activation = await activatePaidSubscription({
      orderId,
      paymentId,
      email,
      name: payment.customer_details?.customer_name,
      plan,
      amount,
      authUserId
    });

    if (!activation) {
      res.status(404).json({
        success: false,
        error: { message: 'User could not be determined or created' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { user, subscription, isNewUser } = activation;

    // Generate tokens for auto-login
    const tokenPayload: any = {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role as any,
      type: user.role === 'admin' || user.role === 'super_admin' ? 'admin' : 'user'
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      userId: user._id.toString(),
      tokenVersion: 0
    });

    logger.info('Payment verified and subscription created', {
      userId: user._id,
      orderId,
      plan,
      amount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        isNewUser,
        accessToken,
        refreshToken,
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount
        },
        payment: {
          orderId,
          status: payment.order_status
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Payment verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: { message: 'Payment verification failed' },
      timestamp: new Date().toISOString()
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: { message: 'Order ID is required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if we have a subscription for this order
    const subscription = await Subscription.findOne({ orderId });
    if (subscription && subscription.status === 'completed') {
      res.status(200).json({
        success: true,
        data: {
          status: 'completed',
          subscription: {
            id: subscription._id,
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            amount: subscription.amount
          }
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // If no local subscription yet, check Cashfree directly
    const paymentResult = await fetchPaymentDetails(orderId);
    if (paymentResult.success && paymentResult.payment) {
      const payment = paymentResult.payment;
      res.status(200).json({
        success: true,
        data: {
          status: payment.order_status === 'PAID' ? 'completed' : 'processing',
          subscription: subscription ? {
            id: subscription._id,
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            amount: subscription.amount
          } : null
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { status: 'processing', subscription: null },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get payment status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.orderId
    });

    res.status(500).json({
      success: false,
      error: { message: 'Failed to get payment status' },
      timestamp: new Date().toISOString()
    });
  }
};

export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const subscriptions = await Subscription.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Subscription.countDocuments({ userId: user._id });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get payment history' },
      timestamp: new Date().toISOString()
    });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = config.CASHFREE_WEBHOOK_SECRET || 'default_webhook_secret';
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    
    if (!signature || !timestamp) {
      res.status(400).json({ success: false, error: { message: 'Webhook signature/timestamp missing' } });
      return;
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const text = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('base64');

    if (signature !== expectedSignature) {
      logger.warn('Webhook signature verification failed', { ip: req.ip });
      res.status(400).json({ success: false, error: { message: 'Invalid webhook signature' } });
      return;
    }

    const { type, data } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const order = data.order || {};
      const payment = data.payment || {};
      const customer = data.customer_details || {};
      const orderId = order.order_id;
      const rawPlan = (order.order_tags || {}).plan || 'premium';
      const plan = rawPlan.toLowerCase() === 'pro' ? 'enterprise' : rawPlan.toLowerCase();

      // Same activation path as verifyPayment. Whichever arrives first wins;
      // the second call sees a completed order and returns null.
      const activation = await activatePaidSubscription({
        orderId,
        paymentId: payment.cf_payment_id ? String(payment.cf_payment_id) : orderId,
        email: customer.customer_email,
        name: customer.customer_name,
        plan,
        amount: payment.payment_amount ?? order.order_amount,
        authUserId: isLookupableUserId((order.order_tags || {}).userId)
      });

      if (activation) {
        logger.info('Subscription activated via webhook', {
          orderId,
          userId: activation.user._id,
          isNewUser: activation.isNewUser
        });
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error instanceof Error ? error.message : 'Unknown error', ip: req.ip });
    res.status(500).json({ success: false, error: { message: 'Webhook processing failed' } });
  }
};
