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
import { commonSchemas, validate } from '../../middleware/validation';

const router = express.Router();

// Webhook endpoint (no authentication required)
router.post('/webhook', handleWebhook);

// Apply authentication to all other payment routes
router.use(authenticate);

// Create payment order
router.post('/create-order',
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
  validate({
    body: commonSchemas.object({
      razorpay_order_id: commonSchemas.string().required(),
      razorpay_payment_id: commonSchemas.string().required(),
      razorpay_signature: commonSchemas.string().required(),
      plan: commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
      amount: commonSchemas.number().positive().required()
    })
  }),
  verifyPayment
);

// Get payment history
router.get('/history',
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
  validate({
    params: commonSchemas.object({
      subscriptionId: commonSchemas.string().required()
    })
  }),
  getPaymentStatus
);

// Cancel subscription
router.post('/cancel-subscription',
  validate({
    body: commonSchemas.object({
      subscriptionId: commonSchemas.string().required(),
      reason: commonSchemas.string().optional()
    })
  }),
  cancelSubscription
);

export default router;
