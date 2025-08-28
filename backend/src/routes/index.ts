import express from 'express';
import userRoutes from './users/userRoutes';
import paymentRoutes from './payments/paymentRoutes';
import subscriptionRoutes from './subscriptions/subscriptionRoutes';
import jobRoutes from './jobs/jobRoutes';
import jobApplicationRoutes from './jobs/jobApplicationRoutes';
import jobMatchingRoutes from './jobs/jobMatchingRoutes';
import authRoutes from './auth/authRoutes';
import clerkAuthRoutes from './auth/clerkAuthRoutes';
import emailNotificationRoutes from './notifications/emailNotificationRoutes';

const router = express.Router();

// API version prefix
const API_VERSION = '/v1';

// Health check endpoint is defined in main index.ts

// Authentication routes (legacy JWT - will be deprecated)
router.use(`${API_VERSION}/auth`, authRoutes);

// Clerk authentication routes (new)
router.use(`${API_VERSION}/clerk-auth`, clerkAuthRoutes);

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

// Email notification routes
router.use(`${API_VERSION}/notifications`, emailNotificationRoutes);

// Placeholder for future routes
router.get(`${API_VERSION}`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'NotifyX API v1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      clerkAuth: `${API_VERSION}/clerk-auth`,
      users: `${API_VERSION}/users`,
      payments: `${API_VERSION}/payments`,
      subscriptions: `${API_VERSION}/subscriptions`,
      jobs: `${API_VERSION}/jobs`,
      applications: `${API_VERSION}/applications`,
      matching: `${API_VERSION}/matching`,
      notifications: `${API_VERSION}/notifications`
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
