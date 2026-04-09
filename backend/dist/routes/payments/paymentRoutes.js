"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../../controllers/payments/paymentController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController_1.handleWebhook);
// Apply authentication to all other payment routes
router.use(jwtAuth_1.authenticate);
// Create payment order
router.post('/create-order', rateLimiter_1.paymentLimiter, (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        plan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_1.commonSchemas.number().positive().required(),
        currency: validation_1.commonSchemas.string().valid('INR', 'USD').default('INR')
    })
}), paymentController_1.createOrder);
// Verify payment
router.post('/verify', rateLimiter_1.paymentLimiter, (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        orderId: validation_1.commonSchemas.string().required(),
        paymentId: validation_1.commonSchemas.string().optional()
    })
}), paymentController_1.verifyPayment);
// Get payment history
router.get('/history', rateLimiter_1.paymentLimiter, (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional()
    })
}), paymentController_1.getPaymentHistory);
// Get payment status by subscription ID
router.get('/status/:subscriptionId', rateLimiter_1.paymentLimiter, (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.string().required()
    })
}), paymentController_1.getPaymentStatus);
// Cancel subscription
router.post('/cancel-subscription', rateLimiter_1.paymentLimiter, (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.string().required(),
        reason: validation_1.commonSchemas.string().optional()
    })
}), paymentController_1.cancelSubscription);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map