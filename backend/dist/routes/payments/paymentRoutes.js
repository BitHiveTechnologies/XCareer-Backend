"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../middleware/validation");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const paymentController_1 = require("../../controllers/payments/paymentController");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController_1.handleWebhook);
// Create payment order
router.post('/create-order', jwtAuth_1.optionalAuth, (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        plan: validation_2.commonSchemas.string().valid('basic', 'premium', 'enterprise').required(),
        amount: validation_2.commonSchemas.number().positive().required(),
        currency: validation_2.commonSchemas.string().valid('INR', 'USD').default('INR')
    })
}), paymentController_1.createOrder);
// Verify payment
router.post('/verify', jwtAuth_1.optionalAuth, (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        orderId: validation_2.commonSchemas.string().required()
    })
}), paymentController_1.verifyPayment);
// Get payment status by order ID (public - used for polling)
router.get('/status/:orderId', jwtAuth_1.optionalAuth, paymentController_1.getPaymentStatus);
// Get payment history
router.get('/history', jwtAuth_1.authenticate, (0, validation_1.validate)({
    query: validation_2.commonSchemas.object({
        page: validation_2.commonSchemas.pagination.page.optional(),
        limit: validation_2.commonSchemas.pagination.limit.optional()
    })
}), paymentController_1.getPaymentHistory);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map