import express from 'express';
import Joi from 'joi';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword
} from '../../controllers/auth/authController';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    User registration
 * @access  Public
 */
router.post('/register',
  validate({
    body: Joi.object({
      name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
      email: Joi.string().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
      mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
        'string.pattern.base': 'Please provide a valid Indian mobile number',
        'any.required': 'Mobile number is required'
      }),
      qualification: Joi.string().required().messages({
        'any.required': 'Qualification is required'
      }),
      stream: Joi.string().required().messages({
        'any.required': 'Stream is required'
      }),
      yearOfPassout: Joi.number().integer().min(2000).max(new Date().getFullYear() + 5).required().messages({
        'number.base': 'Year of passout must be a number',
        'number.integer': 'Year of passout must be an integer',
        'number.min': 'Year of passout must be 2000 or later',
        'number.max': 'Year of passout cannot be more than 5 years in the future',
        'any.required': 'Year of passout is required'
      }),
      cgpaOrPercentage: Joi.number().min(0).max(100).required().messages({
        'number.base': 'CGPA/Percentage must be a number',
        'number.min': 'CGPA/Percentage cannot be negative',
        'number.max': 'CGPA/Percentage cannot exceed 100',
        'any.required': 'CGPA/Percentage is required'
      })
    })
  }),
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login',
  validate({
    body: Joi.object({
      email: Joi.string().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required'
      })
    })
  }),
  login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  validate({
    body: Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required'
      })
    })
  }),
  refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout',
  authenticate,
  logout
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  getCurrentUser
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticate,
  validate({
    body: Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required'
      }),
      newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
    })
  }),
  changePassword
);

export default router;
