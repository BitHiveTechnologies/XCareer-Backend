"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clerkAuth_1 = require("../../middleware/clerkAuth");
const clerkWebhookController_1 = require("../../controllers/auth/clerkWebhookController");
const clerkAuthController_1 = require("../../controllers/auth/clerkAuthController");
const router = express_1.default.Router();
/**
 * @route   POST /api/v1/auth/webhook
 * @desc    Clerk webhook endpoint for user lifecycle events
 * @access  Public (but verified with webhook secret)
 */
router.post('/webhook', clerkWebhookController_1.handleWebhook);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', clerkAuth_1.authenticate, clerkAuthController_1.getCurrentUser);
/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', clerkAuth_1.authenticate, clerkAuthController_1.updateUserProfile);
/**
 * @route   GET /api/v1/auth/admin
 * @desc    Admin-only endpoint for testing admin access
 * @access  Admin only
 */
router.get('/admin', clerkAuth_1.authenticate, clerkAuth_1.requireAdmin, (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Admin access granted',
            user: req.user
        },
        timestamp: new Date().toISOString()
    });
});
/**
 * @route   GET /api/v1/auth/super-admin
 * @desc    Super admin endpoint for testing super admin access
 * @access  Super admin only
 */
router.get('/super-admin', clerkAuth_1.authenticate, clerkAuth_1.requireSuperAdmin, (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Super admin access granted',
            user: req.user
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=clerkAuthRoutes.js.map