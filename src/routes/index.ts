import { Router } from 'express';
import authRoutes from './auth/authRoutes';
import clerkAuthRoutes from './auth/clerkAuthRoutes';
import userRoutes from './users/userRoutes';
import jobRoutes from './jobs/jobRoutes';
import jobApplicationRoutes from './jobs/jobApplicationRoutes';
import jobMatchingRoutes from './jobs/jobMatchingRoutes';
import subscriptionRoutes from './subscriptions/subscriptionRoutes';
import paymentRoutes from './payments/paymentRoutes';
import emailNotificationRoutes from './notifications/emailNotificationRoutes';
import adminRoutes from './admin/adminRoutes';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/clerk-auth`, clerkAuthRoutes);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================
router.use(`${API_VERSION}/users`, userRoutes);

// ============================================================================
// JOB MANAGEMENT ROUTES
// ============================================================================
router.use(`${API_VERSION}/jobs`, jobRoutes);
router.use(`${API_VERSION}/job-applications`, jobApplicationRoutes);
router.use(`${API_VERSION}/job-matching`, jobMatchingRoutes);

// ============================================================================
// SUBSCRIPTION & PAYMENT ROUTES
// ============================================================================
router.use(`${API_VERSION}/subscriptions`, subscriptionRoutes);
router.use(`${API_VERSION}/payments`, paymentRoutes);

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================
router.use(`${API_VERSION}/notifications`, emailNotificationRoutes);

// ============================================================================
// ADMIN ROUTES
// ============================================================================
router.use(`${API_VERSION}/admin`, adminRoutes);

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================
router.get(`${API_VERSION}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NotifyX API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================================
// API DOCUMENTATION ROUTE
// ============================================================================
router.get(`${API_VERSION}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NotifyX API Documentation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: {
        auth: `${API_VERSION}/auth`,
        clerkAuth: `${API_VERSION}/clerk-auth`
      },
      users: `${API_VERSION}/users`,
      jobs: {
        jobs: `${API_VERSION}/jobs`,
        applications: `${API_VERSION}/job-applications`,
        matching: `${API_VERSION}/job-matching`
      },
      subscriptions: `${API_VERSION}/subscriptions`,
      payments: `${API_VERSION}/payments`,
      notifications: `${API_VERSION}/notifications`,
      admin: `${API_VERSION}/admin`,
      health: `${API_VERSION}/health`
    },
    documentation: {
      auth: 'JWT and Clerk-based authentication',
      users: 'User profile and management',
      jobs: 'Job posting, applications, and matching',
      subscriptions: 'Subscription plans and management',
      payments: 'Payment processing and history',
      notifications: 'Email notifications and alerts',
      admin: 'Admin dashboard and management APIs',
      health: 'API health check'
    }
  });
});

export default router;
