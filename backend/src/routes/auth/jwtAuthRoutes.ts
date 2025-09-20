import express from 'express';
import { generateToken, authenticate } from '../../middleware/jwtAuth';
import { logger } from '../../utils/logger';

const router = express.Router();

/**
 * @route   POST /api/v1/jwt-auth/login
 * @desc    Generate JWT token for testing (mock login)
 * @access  Public
 */
router.post('/login', (req, res) => {
  try {
    const { email, role = 'user', firstName = 'Test', lastName = 'User' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate a simple user ID
    const userId = `user_${Date.now()}`;
    
    // Generate JWT token
    const token = generateToken({
      id: userId,
      email,
      firstName,
      lastName,
      role: role as 'user' | 'admin' | 'super_admin',
      metadata: {
        source: 'jwt-auth-route',
        generatedAt: new Date().toISOString()
      }
    });

    logger.info('JWT token generated for testing', {
      userId,
      email,
      role,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          role
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating JWT token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate token'
      },
      timestamp: new Date().toISOString()
    });
  }
});

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

/**
 * @route   POST /api/v1/jwt-auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Token is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // This will be handled by the authenticate middleware in a real implementation
    // For now, just return success if token exists
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        message: 'Token is valid'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

