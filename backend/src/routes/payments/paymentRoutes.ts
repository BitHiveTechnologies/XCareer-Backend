import express from 'express';
import {
    cancelSubscription,
    createOrder,
    getPaymentHistory,
    getPaymentStatus,
    handleWebhook,
    verifyPayment
} from '../../controllers/payments/paymentController';
import { authenticate } from '../../middleware/jwtAuth';
import { paymentLimiter } from '../../middleware/rateLimiter';
import { commonSchemas, validate } from '../../middleware/validation';

const router = express.Router();

// Webhook endpoint (no authentication required)
router.post('/webhook', handleWebhook);

// Apply authentication to all other payment routes
router.use(authenticate);

// Create payment order
router.post('/create-order',
  paymentLimiter,
  validate({
    body: commonSchemas.object({
      plan: commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
      amount: commonSchemas.number().positive().required(),
      currency: commonSchemas.string().valid('INR', 'USD').default('INR')
    })
  }),
  createOrder
);

// Verify payment
router.post('/verify',
  paymentLimiter,
  validate({
    body: commonSchemas.object({
      orderId: commonSchemas.string().required(),
      paymentId: commonSchemas.string().optional()
    })
  }),
  verifyPayment
);

// Get payment history
router.get('/history',
  paymentLimiter,
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional()
    })
  }),
  getPaymentHistory
);

// Get payment status by subscription ID
router.get('/status/:subscriptionId',
  paymentLimiter,
  validate({
    params: commonSchemas.object({
      subscriptionId: commonSchemas.string().required()
    })
  }),
  getPaymentStatus
);

// Cancel subscription
router.post('/cancel-subscription',
  paymentLimiter,
  validate({
    body: commonSchemas.object({
      subscriptionId: commonSchemas.string().required(),
      reason: commonSchemas.string().optional()
    })
  }),
  cancelSubscription
);

export default router;
