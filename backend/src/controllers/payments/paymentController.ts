import crypto from 'crypto';
import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { config } from '../../config/environment';
import { Subscription } from '../../models/Subscription';
import { User } from '../../models/User';
import { UserProvisioningService } from '../../services/userProvisioningService';
import { logger } from '../../utils/logger';

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
 * Handle Razorpay webhook for subscription events
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET || 'default_webhook_secret';
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      logger.warn('Webhook signature missing', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
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

    logger.info('Webhook event received', {
      event,
      paymentId: payload?.payment?.entity?.id || payload?.subscription?.entity?.id,
      ip: req.ip
    });

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
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;
      case 'subscription.completed':
        await handleSubscriptionCompleted(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;
      case 'subscription.resumed':
        await handleSubscriptionResumed(payload);
        break;
      case 'subscription.halted':
        await handleSubscriptionHalted(payload);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(payload);
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

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId } = payload.subscription.entity;
    
    // Find user by customer ID or subscription ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'active'
      });

      logger.info('User subscription activated via webhook', {
        subscriptionId,
        userId: user._id,
        customerId
      });
    }
  } catch (error) {
    logger.error('Handle subscription activated failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription charged event
 */
async function handleSubscriptionCharged(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId } = payload.subscription.entity;
    const { id: paymentId, amount, currency } = payload.payment.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Use user provisioning service for automated setup
      const provisioningData = {
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        subscriptionPlan: UserProvisioningService['determinePlanFromAmount'](amount),
        subscriptionStatus: 'active' as const,
        metadata: {
          source: 'payment_webhook',
          campaign: 'recurring_charge',
          notes: `Payment ID: ${paymentId}, Subscription ID: ${subscriptionId}`
        }
      };

      const result = await UserProvisioningService.provisionUser(provisioningData);
      
      if (result.success) {
        logger.info('User provisioned via subscription charged webhook', {
          subscriptionId,
          paymentId,
          userId: user._id,
          amount,
          currency,
          plan: provisioningData.subscriptionPlan
        });
      } else {
        logger.warn('User provisioning failed via subscription charged webhook', {
          subscriptionId,
          paymentId,
          userId: user._id,
          errors: result.errors
        });
      }
    }
  } catch (error) {
    logger.error('Handle subscription charged failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription completed event
 */
async function handleSubscriptionCompleted(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'completed'
      });

      logger.info('User subscription completed via webhook', {
        subscriptionId,
        userId: user._id,
        customerId
      });
    }
  } catch (error) {
    logger.error('Handle subscription completed failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId, cancelled_at } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'cancelled'
      });

      // Update subscription record
      const subscription = await Subscription.findOne({ userId: user._id });
      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancellationDate = new Date(cancelled_at * 1000);
        subscription.cancellationReason = 'User cancelled via Razorpay';
        await subscription.save();
      }

      logger.info('User subscription cancelled via webhook', {
        subscriptionId,
        userId: user._id,
        customerId,
        cancelledAt: cancelled_at
      });
    }
  } catch (error) {
    logger.error('Handle subscription cancelled failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription paused event
 */
async function handleSubscriptionPaused(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId, paused_at } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'paused'
      });

      logger.info('User subscription paused via webhook', {
        subscriptionId,
        userId: user._id,
        customerId,
        pausedAt: paused_at
      });
    }
  } catch (error) {
    logger.error('Handle subscription paused failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription resumed event
 */
async function handleSubscriptionResumed(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId, resumed_at } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'active'
      });

      logger.info('User subscription resumed via webhook', {
        subscriptionId,
        userId: user._id,
        customerId,
        resumedAt: resumed_at
      });
    }
  } catch (error) {
    logger.error('Handle subscription resumed failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription halted event
 */
async function handleSubscriptionHalted(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId, halted_at } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      // Update user subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'halted'
      });

      logger.info('User subscription halted via webhook', {
        subscriptionId,
        userId: user._id,
        customerId,
        haltedAt: halted_at
      });
    }
  } catch (error) {
    logger.error('Handle subscription halted failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(payload: any): Promise<void> {
  try {
    const { id: subscriptionId, customer_id: customerId, updated_at } = payload.subscription.entity;
    
    // Find user by customer ID
    const user = await User.findOne({ 
      $or: [
        { clerkUserId: customerId },
        { email: customerId }
      ]
    });

    if (user) {
      logger.info('User subscription updated via webhook', {
        subscriptionId,
        userId: user._id,
        customerId,
        updatedAt: updated_at
      });
    }
  } catch (error) {
    logger.error('Handle subscription updated failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
  }
}

/**
 * Get payment status by subscription ID
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
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

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Subscription not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get payment details from Razorpay if payment ID exists
    let paymentDetails = null;
    if (subscription.paymentId) {
      try {
        const payment = await razorpay.payments.fetch(subscription.paymentId);
        paymentDetails = {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          captured: payment.captured,
          createdAt: payment.created_at
        };
      } catch (error) {
        logger.warn('Failed to fetch payment details from Razorpay', {
          error: error instanceof Error ? error.message : 'Unknown error',
          paymentId: subscription.paymentId
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          paymentId: subscription.paymentId,
          orderId: subscription.orderId,
          isActive: (subscription as any).isActive(),
          isExpired: (subscription as any).isExpired(),
          daysRemaining: (subscription as any).getDaysRemaining(),
          daysSinceStart: (subscription as any).getDaysSinceStart()
        },
        payment: paymentDetails
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get payment status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      subscriptionId: req.params.subscriptionId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get payment status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId, reason } = req.body;
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

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Subscription not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if subscription can be cancelled
    if (subscription.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Subscription is already cancelled'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (subscription.status === 'expired') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Cannot cancel expired subscription'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.updatedAt = new Date();
    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'cancelled'
    });

    // Log cancellation
    logger.info('Subscription cancelled', {
      userId,
      subscriptionId,
      plan: subscription.plan,
      reason: reason || 'No reason provided',
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          cancelledAt: subscription.updatedAt,
          reason: reason || 'No reason provided'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cancel subscription failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      subscriptionId: req.body.subscriptionId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel subscription'
      },
      timestamp: new Date().toISOString()
    });
  }
};
