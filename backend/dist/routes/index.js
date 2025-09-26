"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = __importDefault(require("./admin/adminAuth"));
const adminRoutes_1 = __importDefault(require("./admin/adminRoutes"));
const authRoutes_1 = __importDefault(require("./auth/authRoutes"));
const clerkAuthRoutes_1 = __importDefault(require("./auth/clerkAuthRoutes"));
const jwtAuthRoutes_1 = __importDefault(require("./auth/jwtAuthRoutes"));
const jobApplicationRoutes_1 = __importDefault(require("./jobs/jobApplicationRoutes"));
const jobMatchingRoutes_1 = __importDefault(require("./jobs/jobMatchingRoutes"));
const jobRoutes_1 = __importDefault(require("./jobs/jobRoutes"));
const emailNotificationRoutes_1 = __importDefault(require("./notifications/emailNotificationRoutes"));
const notificationRoutes_1 = __importDefault(require("./notifications/notificationRoutes"));
const paymentRoutes_1 = __importDefault(require("./payments/paymentRoutes"));
const performanceRoutes_1 = __importDefault(require("./performanceRoutes"));
const rbacRoutes_1 = __importDefault(require("./rbacRoutes"));
const resumeTemplateRoutes_1 = __importDefault(require("./resumeTemplateRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./subscriptions/subscriptionRoutes"));
const userProvisioningRoutes_1 = __importDefault(require("./userProvisioningRoutes"));
const userRoutes_1 = __importDefault(require("./users/userRoutes"));
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
// Email notification routes (admin only)
router.use(`${API_VERSION}/notifications/email`, emailNotificationRoutes_1.default);
// User notification routes
router.use(`${API_VERSION}/notifications`, notificationRoutes_1.default);
// Admin authentication routes (public)
router.use(`${API_VERSION}/admin`, adminAuth_1.default);
// Admin management routes (protected)
router.use(`${API_VERSION}/admin`, adminRoutes_1.default);
// User provisioning routes (admin only)
router.use(`${API_VERSION}/provisioning`, userProvisioningRoutes_1.default);
// RBAC routes (role-based access control)
router.use(`${API_VERSION}/rbac`, rbacRoutes_1.default);
// Resume template routes
router.use(`${API_VERSION}/templates`, resumeTemplateRoutes_1.default);
// Performance monitoring routes (admin only)
router.use(`${API_VERSION}/performance`, performanceRoutes_1.default);
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
            admin: `${API_VERSION}/admin`,
            provisioning: `${API_VERSION}/provisioning`,
            rbac: `${API_VERSION}/rbac`,
            templates: `${API_VERSION}/templates`,
            performance: `${API_VERSION}/performance`
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map