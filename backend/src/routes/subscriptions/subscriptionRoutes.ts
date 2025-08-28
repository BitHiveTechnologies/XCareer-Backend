import express from 'express';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  getCurrentSubscription,
  getAvailablePlans,
  getSubscriptionHistory,
  cancelSubscription,
  renewSubscription,
  getSubscriptionAnalytics,
  processSubscriptionExpiry
} from '../../controllers/subscriptions/subscriptionController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Apply authentication to all subscription routes
router.use(authenticate);

// Get current subscription
router.get('/current', getCurrentSubscription);

// Get available subscription plans (public, but requires auth for user context)
router.get('/plans', getAvailablePlans);

// Get subscription history
router.get('/history',
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      status: commonSchemas.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired').optional()
    })
  }),
  getSubscriptionHistory
);

// Cancel subscription
router.delete('/:subscriptionId',
  validate({
    params: commonSchemas.object({
      subscriptionId: commonSchemas.objectId.required()
    })
  }),
  cancelSubscription
);

// Renew subscription
router.post('/renew',
  validate({
    body: commonSchemas.object({
      plan: commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
      amount: commonSchemas.number().positive().required()
    })
  }),
  renewSubscription
);

// Admin-only routes
router.use(requireAdmin);

// Get subscription analytics
router.get('/analytics', getSubscriptionAnalytics);

// Process subscription expiry (cron job endpoint)
router.post('/process-expiry', processSubscriptionExpiry);

export default router;
