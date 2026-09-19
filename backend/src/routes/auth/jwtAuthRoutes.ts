import express from 'express';
import { authenticate } from '../../middleware/jwtAuth';
import { logger } from '../../utils/logger';

const router = express.Router();

/**
 * @route   GET /api/v1/jwt-auth/me
 * @desc    Get current user from JWT token
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting current user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user information'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

