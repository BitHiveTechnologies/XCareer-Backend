import express from 'express';
import { validate } from '../../middleware/validation';
import { authenticate, optionalAuth } from '../../middleware/jwtAuth';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentStatus,
  handleWebhook
} from '../../controllers/payments/paymentController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Webhook endpoint (no authentication required)
router.post('/webhook', handleWebhook);

// Create payment order
router.post('/create-order',
  optionalAuth,
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
  optionalAuth,
  validate({
    body: commonSchemas.object({
      orderId: commonSchemas.string().required()
    })
  }),
  verifyPayment
);

// Get payment status by order ID (public - used for polling)
router.get('/status/:orderId',
  optionalAuth,
  getPaymentStatus
);

// Get payment history
router.get('/history',
  authenticate,
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional()
    })
  }),
  getPaymentHistory
);

export default router;
