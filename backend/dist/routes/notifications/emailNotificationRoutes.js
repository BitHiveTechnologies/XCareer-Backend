"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clerkAuth_1 = require("../../middleware/clerkAuth");
const emailNotificationController_1 = require("../../controllers/notifications/emailNotificationController");
const validation_1 = require("../../middleware/validation");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Apply authentication to all notification routes
router.use(clerkAuth_1.authenticate);
// Send welcome email (admin only)
router.post('/welcome', clerkAuth_1.requireAdmin, (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        email: validation_2.commonSchemas.email.required(),
        name: validation_2.commonSchemas.string().min(2).max(100).required()
    })
}), emailNotificationController_1.sendWelcomeEmail);
// Send job alert email (admin only)
router.post('/job-alert', clerkAuth_1.requireAdmin, (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        userId: validation_2.commonSchemas.objectId.required(),
        jobId: validation_2.commonSchemas.objectId.required()
    })
}), emailNotificationController_1.sendJobAlertEmail);
// Get email queue status (admin only)
router.get('/queue-status', clerkAuth_1.requireAdmin, emailNotificationController_1.getEmailQueueStatus);
// Test email connection (admin only)
router.get('/test-connection', clerkAuth_1.requireAdmin, emailNotificationController_1.testEmailConnection);
exports.default = router;
//# sourceMappingURL=emailNotificationRoutes.js.map