import { Router } from 'express';
import { Admin } from '../../models/Admin';
import { logger } from '../../utils/logger';
import { validateRequest } from '../../middleware/validation';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment';

const router = Router();

/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login with email and password
 * @access  Public
 */
router.post('/login', 
  validateRequest({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required()
    })
  }),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email, isActive: true });
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials or account inactive'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        },
        config.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Log successful login
      logger.info('Admin login successful', {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        data: {
          admin: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: admin.permissions
          },
          token
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Admin login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed. Please try again.'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;

