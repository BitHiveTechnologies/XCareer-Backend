import express from 'express';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import {
  getCurrentSubscription,
  getAvailablePlans,
  getSubscriptionHistory,
  cancelSubscription,
  renewSubscription,
  getSubscriptionAnalytics,
  processSubscriptionExpiry,
  updateSubscriptionPlan,
  getUserPlanAccess
} from '../../controllers/subscriptions/subscriptionController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
// Get available subscription plans (public)
router.get('/plans', getAvailablePlans);

// User routes (require user authentication)
router.use(authenticate);

// Get current subscription
router.get('/current', getCurrentSubscription);

// Get current user's plan access/feature flags (e.g. template access, notification priority)
router.get('/access', getUserPlanAccess);

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
      // 'enterprise' is the DB value for Pro plan; 'pro' is accepted as alias by the controller
      plan: commonSchemas.string().valid('basic', 'premium', 'enterprise', 'pro').required(),
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

// Update subscription plan (Admin only)
router.put('/plans/:planId',
  validate({
    params: commonSchemas.object({
      planId: commonSchemas.string().valid('basic', 'premium', 'enterprise').required()
    }),
    body: commonSchemas.object({
      name: commonSchemas.string().min(1).max(100).optional(),
      price: commonSchemas.number().min(0).optional(),
      duration: commonSchemas.number().positive().optional(),
      features: commonSchemas.array().items(commonSchemas.string()).optional(),
      maxJobs: commonSchemas.number().positive().optional(),
      priority: commonSchemas.string().valid('low', 'medium', 'high').optional()
    })
  }),
  updateSubscriptionPlan
);

export default router;
