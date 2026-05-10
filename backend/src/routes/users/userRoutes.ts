import express from 'express';
import Joi from 'joi';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getProfileCompletionStatus,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  getUserStats
} from '../../controllers/users/userController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticate);

// Current user operations (user can access their own profile)
router.get('/me', getCurrentUserProfile);
router.get('/me/completion', getProfileCompletionStatus);
router.put('/me',
  validate({
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional().allow('', null),
      firstName: Joi.string().max(50).optional().allow('', null),
      lastName: Joi.string().max(50).optional().allow('', null),
      mobile: Joi.string().pattern(/^[0-9]{10,15}$/).optional().allow('', null),
      // Profile fields
      qualification: Joi.string().max(100).optional().allow('', null),
      stream: Joi.string().max(100).optional().allow('', null),
      yearOfPassout: Joi.number().integer().min(0).max(new Date().getFullYear() + 10).optional().allow(null),
      cgpaOrPercentage: Joi.number().min(0).max(100).optional().allow(null),
      collegeName: Joi.string().max(200).optional().allow('', null),
      // Additional fields
      dateOfBirth: Joi.date().optional().allow(null, ''),
      address: Joi.string().max(500).optional().allow('', null),
      city: Joi.string().max(100).optional().allow('', null),
      state: Joi.string().max(100).optional().allow('', null),
      pincode: Joi.string().optional().allow('', null),
      skills: Joi.string().max(500).optional().allow('', null),
      resumeUrl: Joi.string().optional().allow('', null),
      linkedinUrl: Joi.string().optional().allow('', null),
      githubUrl: Joi.string().optional().allow('', null)
    })
  }),
  updateCurrentUserProfile
);

// Get user profile by ID (admin or own profile)
router.get('/profile/:userId', getUserProfile);

// Update user profile (user can update their own profile)
router.put('/profile/:userId',
  validate({
    body: commonSchemas.object({
      name: commonSchemas.string().min(2).max(100).optional(),
      mobile: commonSchemas.phoneNumber.optional(),
      // Profile fields
      dateOfBirth: commonSchemas.date.optional(),
      gender: commonSchemas.string().valid('male', 'female', 'other').optional(),
      address: commonSchemas.string().max(500).optional(),
      city: commonSchemas.string().max(100).optional(),
      state: commonSchemas.string().max(100).optional(),
      pincode: commonSchemas.string().pattern(/^[1-9][0-9]{5}$/).optional(),
      // Education fields
      highestQualification: commonSchemas.string().max(100).optional(),
      stream: commonSchemas.string().max(100).optional(),
      college: commonSchemas.string().max(200).optional(),
      graduationYear: commonSchemas.string().pattern(/^(19|20)\d{2}$/).optional(),
      // Professional fields
      experience: commonSchemas.string().max(100).optional(),
      skills: commonSchemas.string().max(500).optional(),
      resumeUrl: commonSchemas.string().uri().optional(),
      linkedinUrl: commonSchemas.string().uri().optional(),
      githubUrl: commonSchemas.string().uri().optional(),
      // Custom fields
      customFields: commonSchemas.object({}).unknown().optional()
    })
  }),
  updateUserProfile
);

// Admin-only routes
router.use(requireAdmin);

// Get all users with pagination and filters
router.get('/',
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      search: commonSchemas.string().max(100).optional(),
      status: commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
      subscriptionPlan: commonSchemas.string().valid('basic', 'premium', 'enterprise').optional()
    })
  }),
  getAllUsers
);

// Delete user
router.delete('/:userId',
  validate({
    params: commonSchemas.object({
      userId: commonSchemas.objectId.required()
    })
  }),
  deleteUser
);

// Get user statistics
router.get('/stats', getUserStats);

export default router;
