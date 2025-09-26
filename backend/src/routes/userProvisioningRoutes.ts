import { Router } from 'express';
import {
    bulkProvisionUsers,
    getProvisioningStats,
    provisionFromExternal,
    provisionUser,
    testProvisioning
} from '../controllers/userProvisioningController';
import { authenticate, requireAdmin } from '../middleware/jwtAuth';
import { commonSchemas, validateRequest } from '../middleware/validation';

const router = Router();

// All routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route POST /api/v1/provisioning/user
 * @desc Provision a single user
 * @access Admin only
 */
router.post('/user', 
  validateRequest({
    body: commonSchemas.object({
      email: commonSchemas.email.required(),
      name: commonSchemas.string().min(2).max(100).required(),
      mobile: commonSchemas.string().optional(),
      clerkUserId: commonSchemas.string().optional(),
      subscriptionPlan: commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
      subscriptionStatus: commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
      profileData: commonSchemas.object({
        firstName: commonSchemas.string().optional(),
        lastName: commonSchemas.string().optional(),
        qualification: commonSchemas.string().optional(),
        stream: commonSchemas.string().optional(),
        yearOfPassout: commonSchemas.number().optional(),
        cgpaOrPercentage: commonSchemas.number().optional(),
        collegeName: commonSchemas.string().optional(),
        dateOfBirth: commonSchemas.date.optional()
      }).optional(),
      metadata: commonSchemas.object({
        source: commonSchemas.string().optional(),
        campaign: commonSchemas.string().optional(),
        referrer: commonSchemas.string().optional(),
        notes: commonSchemas.string().optional()
      }).optional()
    })
  }),
  provisionUser
);

/**
 * @route POST /api/v1/provisioning/bulk
 * @desc Bulk provision users
 * @access Admin only
 */
router.post('/bulk',
  validateRequest({
    body: commonSchemas.object({
      users: commonSchemas.array().items(commonSchemas.object({
        email: commonSchemas.email.required(),
        name: commonSchemas.string().min(2).max(100).required(),
        mobile: commonSchemas.string().optional(),
        clerkUserId: commonSchemas.string().optional(),
        subscriptionPlan: commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
        subscriptionStatus: commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
        profileData: commonSchemas.object({
          firstName: commonSchemas.string().optional(),
          lastName: commonSchemas.string().optional(),
          qualification: commonSchemas.string().optional(),
          stream: commonSchemas.string().optional(),
          yearOfPassout: commonSchemas.number().optional(),
          cgpaOrPercentage: commonSchemas.number().optional(),
          collegeName: commonSchemas.string().optional(),
          dateOfBirth: commonSchemas.date.optional()
        }).optional(),
        metadata: commonSchemas.object({
          source: commonSchemas.string().optional(),
          campaign: commonSchemas.string().optional(),
          referrer: commonSchemas.string().optional(),
          notes: commonSchemas.string().optional()
        }).optional()
      })).min(1).max(100).required()
    })
  }),
  bulkProvisionUsers
);

/**
 * @route GET /api/v1/provisioning/stats
 * @desc Get provisioning statistics
 * @access Admin only
 */
router.get('/stats', getProvisioningStats);

/**
 * @route POST /api/v1/provisioning/external
 * @desc Provision user from external system
 * @access Admin only
 */
router.post('/external',
  validateRequest({
    body: commonSchemas.object({
      source: commonSchemas.string().valid('razorpay', 'clerk', 'csv_import').required(),
      data: commonSchemas.object({}).required()
    })
  }),
  provisionFromExternal
);

/**
 * @route POST /api/v1/provisioning/test
 * @desc Test user provisioning
 * @access Admin only
 */
router.post('/test', testProvisioning);

export default router;
