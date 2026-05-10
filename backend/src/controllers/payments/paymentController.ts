import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';
import { createCashfreeOrder, fetchPaymentDetails, calculateSubscriptionEndDate } from '../../utils/paymentService';
import { emailService } from '../../utils/emailService';
import { generateToken, generateRefreshToken } from '../../utils/jwt';

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

    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid subscription plan' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid amount' },
        timestamp: new Date().toISOString()
      });
      return;
    }


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
      amount,
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
    const plan = tags.plan || 'premium';
    const amount = payment.order_amount;
    const paymentId = payment.payment_session_id || orderId; // or appropriate payment ID

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
      // Create guest user
      tempPassword = Math.random().toString(36).slice(-8) + 'X!';
      logger.info('TEST_CREDENTIALS', { email, password: tempPassword });
      require('fs').writeFileSync('/Users/apple/Desktop/Careerx/test_creds.txt', `Email: ${email}\nPassword: ${tempPassword}`);
      user = new User({
        email,
        name: payment.customer_details?.customer_name || 'User',
        password: tempPassword,
        role: 'user',
        mustChangePassword: true
      });
      await user.save();
      isNewUser = true;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User could not be determined or created' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const userId = user._id;

    let subscription = await Subscription.findOne({ userId });
    const now = new Date();
    const endDate = calculateSubscriptionEndDate(plan, now);
    
    if (subscription) {
      subscription.plan = plan;
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
        plan,
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
      userId,
      orderId,
      plan,
      amount,
      ip: req.ip
    });

    // Send confirmation email
    const confirmationHtml = `
      <h1>Your NotifyX ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription is Active!</h1>
      <p>Amount Paid: ₹${amount}</p>
      <p>Valid Until: ${endDate.toDateString()}</p>
      <p>Thank you for choosing NotifyX.</p>
    `;
    await emailService.sendEmail({
      to: email,
      subject: `Your NotifyX ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription is Active!`,
      template: 'subscription-confirmation',
      context: { html: confirmationHtml, text: 'Your subscription is active.' }
    }).catch(err => logger.error('Failed to send confirmation email', { error: err }));

    if (isNewUser) {
      const credentialsHtml = `
        <h1>Your X Career Account Credentials</h1>
        <p>Login URL: <a href="${config.FRONTEND_URL}/login">${config.FRONTEND_URL}/login</a></p>
        <p>Email: ${email}</p>
        <p>Password: ${tempPassword}</p>
        <p>Please change your password after your first login.</p>
      `;
      await emailService.sendEmail({
        to: email,
        subject: 'Your X Career Account Credentials',
        template: 'login-credentials',
        context: { html: credentialsHtml, text: `Email: ${email}\nPassword: ${tempPassword}` }
      }).catch(err => logger.error('Failed to send credentials email', { error: err }));
    }

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
      const paymentId = data.payment.payment_id;
      const orderId = data.order.order_id;
      
      const subscription = await Subscription.findOne({ orderId });
      if (subscription && subscription.status !== 'completed') {
        subscription.status = 'completed';
        subscription.paymentId = paymentId;
        await subscription.save();

        await User.findByIdAndUpdate(subscription.userId, {
          subscriptionPlan: subscription.plan,
          subscriptionStatus: 'completed'
        });

        logger.info('Subscription activated via webhook', { orderId, subscriptionId: subscription._id });
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error instanceof Error ? error.message : 'Unknown error', ip: req.ip });
    res.status(500).json({ success: false, error: { message: 'Webhook processing failed' } });
  }
};
