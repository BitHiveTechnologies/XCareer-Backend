"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./users/userRoutes"));
const paymentRoutes_1 = __importDefault(require("./payments/paymentRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./subscriptions/subscriptionRoutes"));
const jobRoutes_1 = __importDefault(require("./jobs/jobRoutes"));
const jobApplicationRoutes_1 = __importDefault(require("./jobs/jobApplicationRoutes"));
const jobMatchingRoutes_1 = __importDefault(require("./jobs/jobMatchingRoutes"));
const authRoutes_1 = __importDefault(require("./auth/authRoutes"));
const clerkAuthRoutes_1 = __importDefault(require("./auth/clerkAuthRoutes"));
const jwtAuthRoutes_1 = __importDefault(require("./auth/jwtAuthRoutes"));
const emailNotificationRoutes_1 = __importDefault(require("./notifications/emailNotificationRoutes"));
const adminAuth_1 = __importDefault(require("./admin/adminAuth"));
const adminRoutes_1 = __importDefault(require("./admin/adminRoutes"));
const router = express_1.default.Router();
// API version prefix
const API_VERSION = '/v1';
// Health check endpoint is defined in main index.ts
// Authentication routes (legacy JWT - will be deprecated)
router.use(`${API_VERSION}/auth`, authRoutes_1.default);
// Clerk authentication routes (new)
router.use(`${API_VERSION}/clerk-auth`, clerkAuthRoutes_1.default);
// JWT authentication routes (core)
router.use(`${API_VERSION}/jwt-auth`, jwtAuthRoutes_1.default);
// User management routes
router.use(`${API_VERSION}/users`, userRoutes_1.default);
// Payment routes
router.use(`${API_VERSION}/payments`, paymentRoutes_1.default);
// Subscription routes
router.use(`${API_VERSION}/subscriptions`, subscriptionRoutes_1.default);
// Job management routes
router.use(`${API_VERSION}/jobs`, jobRoutes_1.default);
// Job application routes
router.use(`${API_VERSION}/applications`, jobApplicationRoutes_1.default);
// Job matching routes
router.use(`${API_VERSION}/matching`, jobMatchingRoutes_1.default);
// Email notification routes
router.use(`${API_VERSION}/notifications`, emailNotificationRoutes_1.default);
// Admin authentication routes (public)
router.use(`${API_VERSION}/admin`, adminAuth_1.default);
// Admin management routes (protected)
router.use(`${API_VERSION}/admin`, adminRoutes_1.default);
// Placeholder for future routes
router.get(`${API_VERSION}`, (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'NotifyX API v1.0.0',
        endpoints: {
            auth: `${API_VERSION}/auth`,
            clerkAuth: `${API_VERSION}/clerk-auth`,
            jwtAuth: `${API_VERSION}/jwt-auth`,
            users: `${API_VERSION}/users`,
            payments: `${API_VERSION}/payments`,
            subscriptions: `${API_VERSION}/subscriptions`,
            jobs: `${API_VERSION}/jobs`,
            applications: `${API_VERSION}/applications`,
            matching: `${API_VERSION}/matching`,
            notifications: `${API_VERSION}/notifications`,
            admin: `${API_VERSION}/admin`
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map