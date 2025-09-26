"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userProvisioningController_1 = require("../controllers/userProvisioningController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication and admin privileges
router.use(jwtAuth_1.authenticate);
router.use(jwtAuth_1.requireAdmin);
/**
 * @route POST /api/v1/provisioning/user
 * @desc Provision a single user
 * @access Admin only
 */
router.post('/user', (0, validation_1.validateRequest)({
    body: validation_1.commonSchemas.object({
        email: validation_1.commonSchemas.email.required(),
        name: validation_1.commonSchemas.string().min(2).max(100).required(),
        mobile: validation_1.commonSchemas.string().optional(),
        clerkUserId: validation_1.commonSchemas.string().optional(),
        subscriptionPlan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
        subscriptionStatus: validation_1.commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
        profileData: validation_1.commonSchemas.object({
            firstName: validation_1.commonSchemas.string().optional(),
            lastName: validation_1.commonSchemas.string().optional(),
            qualification: validation_1.commonSchemas.string().optional(),
            stream: validation_1.commonSchemas.string().optional(),
            yearOfPassout: validation_1.commonSchemas.number().optional(),
            cgpaOrPercentage: validation_1.commonSchemas.number().optional(),
            collegeName: validation_1.commonSchemas.string().optional(),
            dateOfBirth: validation_1.commonSchemas.date.optional()
        }).optional(),
        metadata: validation_1.commonSchemas.object({
            source: validation_1.commonSchemas.string().optional(),
            campaign: validation_1.commonSchemas.string().optional(),
            referrer: validation_1.commonSchemas.string().optional(),
            notes: validation_1.commonSchemas.string().optional()
        }).optional()
    })
}), userProvisioningController_1.provisionUser);
/**
 * @route POST /api/v1/provisioning/bulk
 * @desc Bulk provision users
 * @access Admin only
 */
router.post('/bulk', (0, validation_1.validateRequest)({
    body: validation_1.commonSchemas.object({
        users: validation_1.commonSchemas.array().items(validation_1.commonSchemas.object({
            email: validation_1.commonSchemas.email.required(),
            name: validation_1.commonSchemas.string().min(2).max(100).required(),
            mobile: validation_1.commonSchemas.string().optional(),
            clerkUserId: validation_1.commonSchemas.string().optional(),
            subscriptionPlan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
            subscriptionStatus: validation_1.commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
            profileData: validation_1.commonSchemas.object({
                firstName: validation_1.commonSchemas.string().optional(),
                lastName: validation_1.commonSchemas.string().optional(),
                qualification: validation_1.commonSchemas.string().optional(),
                stream: validation_1.commonSchemas.string().optional(),
                yearOfPassout: validation_1.commonSchemas.number().optional(),
                cgpaOrPercentage: validation_1.commonSchemas.number().optional(),
                collegeName: validation_1.commonSchemas.string().optional(),
                dateOfBirth: validation_1.commonSchemas.date.optional()
            }).optional(),
            metadata: validation_1.commonSchemas.object({
                source: validation_1.commonSchemas.string().optional(),
                campaign: validation_1.commonSchemas.string().optional(),
                referrer: validation_1.commonSchemas.string().optional(),
                notes: validation_1.commonSchemas.string().optional()
            }).optional()
        })).min(1).max(100).required()
    })
}), userProvisioningController_1.bulkProvisionUsers);
/**
 * @route GET /api/v1/provisioning/stats
 * @desc Get provisioning statistics
 * @access Admin only
 */
router.get('/stats', userProvisioningController_1.getProvisioningStats);
/**
 * @route POST /api/v1/provisioning/external
 * @desc Provision user from external system
 * @access Admin only
 */
router.post('/external', (0, validation_1.validateRequest)({
    body: validation_1.commonSchemas.object({
        source: validation_1.commonSchemas.string().valid('razorpay', 'clerk', 'csv_import').required(),
        data: validation_1.commonSchemas.object({}).required()
    })
}), userProvisioningController_1.provisionFromExternal);
/**
 * @route POST /api/v1/provisioning/test
 * @desc Test user provisioning
 * @access Admin only
 */
router.post('/test', userProvisioningController_1.testProvisioning);
exports.default = router;
//# sourceMappingURL=userProvisioningRoutes.js.map