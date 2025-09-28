"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const enhancedSubscriptionController_1 = require("../../controllers/subscriptions/enhancedSubscriptionController");
const subscriptionController_1 = require("../../controllers/subscriptions/subscriptionController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
// Get available subscription plans (public)
router.get('/plans', subscriptionController_1.getAvailablePlans);
// User routes (require user authentication)
router.use(jwtAuth_1.authenticate);
// Get current subscription
router.get('/current', subscriptionController_1.getCurrentSubscription);
// Get subscription history
router.get('/history', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional(),
        status: validation_1.commonSchemas.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired').optional()
    })
}), subscriptionController_1.getSubscriptionHistory);
// Cancel subscription
router.delete('/:subscriptionId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.objectId.required()
    })
}), subscriptionController_1.cancelSubscription);
// Renew subscription
router.post('/renew', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        plan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_1.commonSchemas.number().positive().required()
    })
}), subscriptionController_1.renewSubscription);
// Enhanced subscription endpoints (user accessible)
router.get('/insights', enhancedSubscriptionController_1.getSubscriptionInsights);
router.put('/settings', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.string().required(),
        autoRenew: validation_1.commonSchemas.string().optional(),
        notifications: validation_1.commonSchemas.string().optional()
    })
}), enhancedSubscriptionController_1.updateSubscriptionSettings);
// Admin-only routes
router.use(jwtAuth_1.requireAdmin);
// Get all subscriptions (admin only)
router.get('/', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional(),
        status: validation_1.commonSchemas.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired', 'active').optional(),
        plan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').optional()
    })
}), async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch subscriptions' },
            timestamp: new Date().toISOString()
        });
    }
});
// Get subscription analytics
router.get('/analytics', subscriptionController_1.getSubscriptionAnalytics);
// Process subscription expiry (cron job endpoint)
router.post('/process-expiry', subscriptionController_1.processSubscriptionExpiry);
// Admin-only enhanced endpoints
router.get('/analytics/enhanced', enhancedSubscriptionController_1.getEnhancedAnalytics);
router.get('/metadata', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        source: validation_1.commonSchemas.string().optional(),
        campaign: validation_1.commonSchemas.string().optional(),
        referrer: validation_1.commonSchemas.string().optional(),
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional()
    })
}), enhancedSubscriptionController_1.getSubscriptionsByMetadata);
router.get('/statistics', enhancedSubscriptionController_1.getSubscriptionStatistics);
// Update subscription plan (Admin only)
router.put('/plans/:planId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        planId: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').required()
    }),
    body: validation_1.commonSchemas.object({
        name: validation_1.commonSchemas.string().min(1).max(100).optional(),
        price: validation_1.commonSchemas.number().min(0).optional(),
        duration: validation_1.commonSchemas.number().positive().optional(),
        features: validation_1.commonSchemas.array().items(validation_1.commonSchemas.string()).optional(),
        maxJobs: validation_1.commonSchemas.number().positive().optional(),
        priority: validation_1.commonSchemas.string().valid('low', 'medium', 'high').optional()
    })
}), subscriptionController_1.updateSubscriptionPlan);
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map