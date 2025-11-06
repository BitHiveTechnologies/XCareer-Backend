import express from 'express';
import {
    deleteUser,
    getAllUsers,
    getCurrentUserProfile,
    getProfileCompletionStatus,
    getUserProfile,
    getUserStats,
    updateCurrentUserProfile,
    updateUserProfile
} from '../../controllers/users/userController';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import { commonSchemas, validate } from '../../middleware/validation';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticate);

// Current user operations (user can access their own profile)
router.get('/me', getCurrentUserProfile);
router.get('/me/completion', getProfileCompletionStatus);
router.put('/me',
  validate({
    body: commonSchemas.object({
      name: commonSchemas.string().min(2).max(100).optional(),
      mobile: commonSchemas.phoneNumber.optional(),
      // Profile fields
      qualification: commonSchemas.string().max(100).optional(),
      stream: commonSchemas.string().max(100).optional(),
      yearOfPassout: commonSchemas.number().integer().min(2000).max(new Date().getFullYear() + 5).optional(),
      cgpaOrPercentage: commonSchemas.number().min(0).max(100).optional(),
      collegeName: commonSchemas.string().allow('', null).max(200).optional(),
      // Additional fields
      dateOfBirth: commonSchemas.date.optional(),
      skills: commonSchemas.string().allow('', null).max(500).optional(),
      resumeUrl: commonSchemas.uri().allow('', null).optional(),
      linkedinUrl: commonSchemas.uri().allow('', null).optional(),
      githubUrl: commonSchemas.uri().allow('', null).optional()
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
