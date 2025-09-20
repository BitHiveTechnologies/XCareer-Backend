import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET
});

/**
 * Create a new payment order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, amount, currency = 'INR' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate plan
    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid subscription plan'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid amount'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `order_${Date.now()}_${userId}`,
      notes: {
        userId,
        plan,
        purpose: 'subscription_payment'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Log order creation
    logger.info('Payment order created', {
      userId,
      orderId: order.id,
      amount,
      plan,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status
        },
        keyId: config.RAZORPAY_KEY_ID
      },
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
      error: {
        message: 'Failed to create order'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify payment and create subscription
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan,
      amount
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      logger.warn('Payment signature verification failed', {
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Payment verification failed'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Payment not completed'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate subscription dates
    const now = new Date();
    let endDate: Date;
    
    switch (plan) {
      case 'basic':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'premium':
        endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
      case 'enterprise':
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
        break;
      default:
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    }

    // Create or update subscription
    let subscription = await Subscription.findOne({ userId });
    
    if (subscription) {
      // Update existing subscription
      subscription.plan = plan;
      subscription.amount = amount;
      subscription.paymentId = razorpay_payment_id;
      subscription.orderId = razorpay_order_id;
      subscription.status = 'completed';
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.updatedAt = now;
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId,
        plan,
        amount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'completed',
        startDate: now,
        endDate
      });
    }

    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: plan,
      subscriptionStatus: 'completed'
    });

    // Log successful payment
    logger.info('Payment verified and subscription created', {
      userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      plan,
      amount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount
        },
        payment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          status: payment.status
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
      error: {
        message: 'Payment verification failed'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by email (JWT provides email)
    const user = await User.findOne({ email: req.user?.email });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get user's subscription history
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
    logger.error('Get payment history failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get payment history'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle Razorpay webhook
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET || 'default_webhook_secret';
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Webhook signature missing'
        }
      });
      return;
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Webhook signature verification failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid webhook signature'
        }
      });
      return;
    }

    const { event, payload } = req.body;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;
      default:
        logger.info('Unhandled webhook event', { event, payload });
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Webhook processing failed'
      }
    });
  }
};

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payload: any): Promise<void> {
  try {
    const { id: paymentId, order_id: orderId } = payload.payment.entity;
    
    // Update subscription status if not already updated
    const subscription = await Subscription.findOne({ 
      paymentId, 
      orderId 
    });

    if (subscription && subscription.status !== 'completed') {
      subscription.status = 'completed';
      await subscription.save();

      logger.info('Subscription activated via webhook', {
        paymentId,
        orderId,
        subscriptionId: subscription._id
      });
    }
  } catch (error) {
    logger.error('Handle payment captured failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payload: any): Promise<void> {
  try {
    const { id: paymentId, order_id: orderId } = payload.payment.entity;
    
    // Update subscription status
    const subscription = await Subscription.findOne({ 
      paymentId, 
      orderId 
    });

    if (subscription) {
      subscription.status = 'failed';
      await subscription.save();

      logger.info('Subscription marked as failed via webhook', {
        paymentId,
        orderId,
        subscriptionId: subscription._id
      });
    }
  } catch (error) {
    logger.error('Handle payment failed failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle refund processed event
 */
async function handleRefundProcessed(payload: any): Promise<void> {
  try {
    const { payment_id: paymentId } = payload.refund.entity;
    
    // Update subscription status
    const subscription = await Subscription.findOne({ paymentId });

    if (subscription) {
      subscription.status = 'refunded';
      await subscription.save();

      logger.info('Subscription marked as refunded via webhook', {
        paymentId,
        subscriptionId: subscription._id
      });
    }
  } catch (error) {
    logger.error('Handle refund processed failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}
