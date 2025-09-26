import express from 'express';
import adminAuthRoutes from './admin/adminAuth';
import adminRoutes from './admin/adminRoutes';
import authRoutes from './auth/authRoutes';
import clerkAuthRoutes from './auth/clerkAuthRoutes';
import jwtAuthRoutes from './auth/jwtAuthRoutes';
import jobApplicationRoutes from './jobs/jobApplicationRoutes';
import jobMatchingRoutes from './jobs/jobMatchingRoutes';
import jobRoutes from './jobs/jobRoutes';
import emailNotificationRoutes from './notifications/emailNotificationRoutes';
import notificationRoutes from './notifications/notificationRoutes';
import paymentRoutes from './payments/paymentRoutes';
import performanceRoutes from './performanceRoutes';
import rbacRoutes from './rbacRoutes';
import resumeTemplateRoutes from './resumeTemplateRoutes';
import subscriptionRoutes from './subscriptions/subscriptionRoutes';
import userProvisioningRoutes from './userProvisioningRoutes';
import userRoutes from './users/userRoutes';

const router = express.Router();

// API version prefix
const API_VERSION = '/v1';

// Health check endpoint is defined in main index.ts

// Authentication routes (legacy JWT - will be deprecated)
router.use(`${API_VERSION}/auth`, authRoutes);

// Clerk authentication routes (new)
router.use(`${API_VERSION}/clerk-auth`, clerkAuthRoutes);

// JWT authentication routes (core)
router.use(`${API_VERSION}/jwt-auth`, jwtAuthRoutes);

// User management routes
router.use(`${API_VERSION}/users`, userRoutes);

// Payment routes
router.use(`${API_VERSION}/payments`, paymentRoutes);

// Subscription routes
router.use(`${API_VERSION}/subscriptions`, subscriptionRoutes);

// Job management routes
router.use(`${API_VERSION}/jobs`, jobRoutes);

// Job application routes
router.use(`${API_VERSION}/applications`, jobApplicationRoutes);

// Job matching routes
router.use(`${API_VERSION}/matching`, jobMatchingRoutes);

// Email notification routes (admin only)
router.use(`${API_VERSION}/notifications/email`, emailNotificationRoutes);

// User notification routes
router.use(`${API_VERSION}/notifications`, notificationRoutes);

// Admin authentication routes (public)
router.use(`${API_VERSION}/admin`, adminAuthRoutes);

// Admin management routes (protected)
router.use(`${API_VERSION}/admin`, adminRoutes);

// User provisioning routes (admin only)
router.use(`${API_VERSION}/provisioning`, userProvisioningRoutes);

// RBAC routes (role-based access control)
router.use(`${API_VERSION}/rbac`, rbacRoutes);

// Resume template routes
router.use(`${API_VERSION}/templates`, resumeTemplateRoutes);

// Performance monitoring routes (admin only)
router.use(`${API_VERSION}/performance`, performanceRoutes);

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

export default router;
