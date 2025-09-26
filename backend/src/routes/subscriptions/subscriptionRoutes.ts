import express from 'express';
import {
    getEnhancedAnalytics,
    getSubscriptionInsights,
    getSubscriptionsByMetadata,
    getSubscriptionStatistics,
    updateSubscriptionSettings
} from '../../controllers/subscriptions/enhancedSubscriptionController';
import {
    cancelSubscription,
    getAvailablePlans,
    getCurrentSubscription,
    getSubscriptionAnalytics,
    getSubscriptionHistory,
    processSubscriptionExpiry,
    renewSubscription
} from '../../controllers/subscriptions/subscriptionController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import { commonSchemas, validate } from '../../middleware/validation';

const router = express.Router();

// Get available subscription plans (public endpoint)
router.get('/plans', getAvailablePlans);

// Apply authentication to all other subscription routes
router.use(authenticate);

// Get current subscription
router.get('/current', getCurrentSubscription);

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

// Enhanced subscription endpoints (user accessible)
router.get('/insights', getSubscriptionInsights);
router.put('/settings',
  validate({
    body: commonSchemas.object({
      subscriptionId: commonSchemas.string().required(),
      autoRenew: commonSchemas.string().optional(),
      notifications: commonSchemas.string().optional()
    })
  }),
  updateSubscriptionSettings
);

// Admin-only routes
router.use(requireAdmin);

// Get all subscriptions (admin only)
router.get('/',
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      status: commonSchemas.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired', 'active').optional(),
      plan: commonSchemas.string().valid('basic', 'premium', 'enterprise').optional()
    })
  }),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, plan } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      // This would typically call a controller method
      res.status(200).json({
        success: true,
        data: {
          subscriptions: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch subscriptions' },
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get subscription analytics
router.get('/analytics', getSubscriptionAnalytics);

// Process subscription expiry (cron job endpoint)
router.post('/process-expiry', processSubscriptionExpiry);

// Admin-only enhanced endpoints
router.get('/analytics/enhanced', getEnhancedAnalytics);
router.get('/metadata',
  validate({
    query: commonSchemas.object({
      source: commonSchemas.string().optional(),
      campaign: commonSchemas.string().optional(),
      referrer: commonSchemas.string().optional(),
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional()
    })
  }),
  getSubscriptionsByMetadata
);
router.get('/statistics', getSubscriptionStatistics);

export default router;
