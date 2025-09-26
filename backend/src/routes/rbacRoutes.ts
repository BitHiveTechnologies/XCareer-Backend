import { Router } from 'express';
import Joi from 'joi';
import {
    checkPermission,
    getRolesAndPermissions,
    getSubscriptionLimits,
    getUserPermissions,
    validateAccess
} from '../controllers/rbacController';
import { authenticate } from '../middleware/jwtAuth';
import { requireAdminPermission } from '../middleware/rbacMiddleware';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/v1/rbac/permissions
 * @desc Get current user's permissions and capabilities
 * @access Private
 */
router.get('/permissions', authenticate, getUserPermissions);

/**
 * @route POST /api/v1/rbac/check-permission
 * @desc Check if user has specific permission
 * @access Private
 */
router.post('/check-permission', 
  authenticate,
  validate({
    body: Joi.object({
      resource: Joi.string().required(),
      action: Joi.string().required(),
      conditions: Joi.object().optional()
    })
  }),
  checkPermission
);

/**
 * @route GET /api/v1/rbac/roles
 * @desc Get all available roles and permissions
 * @access Private (Admin only)
 */
router.get('/roles', authenticate, requireAdminPermission, getRolesAndPermissions);

/**
 * @route GET /api/v1/rbac/limits
 * @desc Get user's subscription limits
 * @access Private
 */
router.get('/limits', authenticate, getSubscriptionLimits);

/**
 * @route POST /api/v1/rbac/validate-access
 * @desc Validate user access to specific resource
 * @access Private
 */
router.post('/validate-access',
  authenticate,
  validate({
    body: Joi.object({
      resource: Joi.string().required(),
      action: Joi.string().required(),
      conditions: Joi.object().optional()
    })
  }),
  validateAccess
);

export default router;
