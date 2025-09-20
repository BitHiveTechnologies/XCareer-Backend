"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../middleware/validation");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const subscriptionController_1 = require("../../controllers/subscriptions/subscriptionController");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Apply authentication to all subscription routes
router.use(jwtAuth_1.authenticate);
// Get current subscription
router.get('/current', subscriptionController_1.getCurrentSubscription);
// Get available subscription plans (public, but requires auth for user context)
router.get('/plans', subscriptionController_1.getAvailablePlans);
// Get subscription history
router.get('/history', (0, validation_1.validate)({
    query: validation_2.commonSchemas.object({
        page: validation_2.commonSchemas.pagination.page.optional(),
        limit: validation_2.commonSchemas.pagination.limit.optional(),
        status: validation_2.commonSchemas.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled', 'expired').optional()
    })
}), subscriptionController_1.getSubscriptionHistory);
// Cancel subscription
router.delete('/:subscriptionId', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        subscriptionId: validation_2.commonSchemas.objectId.required()
    })
}), subscriptionController_1.cancelSubscription);
// Renew subscription
router.post('/renew', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        plan: validation_2.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_2.commonSchemas.number().positive().required()
    })
}), subscriptionController_1.renewSubscription);
// Admin-only routes
router.use(jwtAuth_1.requireAdmin);
// Get subscription analytics
router.get('/analytics', subscriptionController_1.getSubscriptionAnalytics);
// Process subscription expiry (cron job endpoint)
router.post('/process-expiry', subscriptionController_1.processSubscriptionExpiry);
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map