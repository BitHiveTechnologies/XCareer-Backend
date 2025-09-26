"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../../controllers/payments/paymentController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController_1.handleWebhook);
// Apply authentication to all other payment routes
router.use(jwtAuth_1.authenticate);
// Create payment order
router.post('/create-order', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        plan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_1.commonSchemas.number().positive().required(),
        currency: validation_1.commonSchemas.string().valid('INR', 'USD').default('INR')
    })
}), paymentController_1.createOrder);
// Verify payment
router.post('/verify', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        razorpay_order_id: validation_1.commonSchemas.string().required(),
        razorpay_payment_id: validation_1.commonSchemas.string().required(),
        razorpay_signature: validation_1.commonSchemas.string().required(),
        plan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_1.commonSchemas.number().positive().required()
    })
}), paymentController_1.verifyPayment);
// Get payment history
router.get('/history', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional()
    })
}), paymentController_1.getPaymentHistory);
// Get payment status by subscription ID
router.get('/status/:subscriptionId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.string().required()
    })
}), paymentController_1.getPaymentStatus);
// Cancel subscription
router.post('/cancel-subscription', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        subscriptionId: validation_1.commonSchemas.string().required(),
        reason: validation_1.commonSchemas.string().optional()
    })
}), paymentController_1.cancelSubscription);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map