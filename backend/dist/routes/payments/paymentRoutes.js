"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../middleware/validation");
const auth_1 = require("../../middleware/auth");
const paymentController_1 = require("../../controllers/payments/paymentController");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController_1.handleWebhook);
// Apply authentication to all other payment routes
router.use(auth_1.authenticate);
// Create payment order
router.post('/create-order', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        plan: validation_2.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_2.commonSchemas.number().positive().required(),
        currency: validation_2.commonSchemas.string().valid('INR', 'USD').default('INR')
    })
}), paymentController_1.createOrder);
// Verify payment
router.post('/verify', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        razorpay_order_id: validation_2.commonSchemas.string().required(),
        razorpay_payment_id: validation_2.commonSchemas.string().required(),
        razorpay_signature: validation_2.commonSchemas.string().required(),
        plan: validation_2.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_2.commonSchemas.number().positive().required()
    })
}), paymentController_1.verifyPayment);
// Get payment history
router.get('/history', (0, validation_1.validate)({
    query: validation_2.commonSchemas.object({
        page: validation_2.commonSchemas.pagination.page.optional(),
        limit: validation_2.commonSchemas.pagination.limit.optional()
    })
}), paymentController_1.getPaymentHistory);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map