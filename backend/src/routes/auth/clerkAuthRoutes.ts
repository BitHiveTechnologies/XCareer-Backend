import express from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../../middleware/clerkAuth';
import { handleWebhook } from '../../controllers/auth/clerkWebhookController';
import { getCurrentUser, updateUserProfile } from '../../controllers/auth/clerkAuthController';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/webhook
 * @desc    Clerk webhook endpoint for user lifecycle events
 * @access  Public (but verified with webhook secret)
 */
router.post('/webhook', handleWebhook);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateUserProfile);

/**
 * @route   GET /api/v1/auth/admin
 * @desc    Admin-only endpoint for testing admin access
 * @access  Admin only
 */
router.get('/admin', authenticate, requireAdmin, (req, res) => {
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
router.get('/super-admin', authenticate, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Super admin access granted',
      user: req.user
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
