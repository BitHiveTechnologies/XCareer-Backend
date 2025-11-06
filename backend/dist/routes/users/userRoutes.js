"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../../controllers/users/userController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Apply authentication to all user routes
router.use(jwtAuth_1.authenticate);
// Current user operations (user can access their own profile)
router.get('/me', userController_1.getCurrentUserProfile);
router.get('/me/completion', userController_1.getProfileCompletionStatus);
router.put('/me', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        name: validation_1.commonSchemas.string().min(2).max(100).optional(),
        mobile: validation_1.commonSchemas.phoneNumber.optional(),
        // Profile fields
        qualification: validation_1.commonSchemas.string().max(100).optional(),
        stream: validation_1.commonSchemas.string().max(100).optional(),
        yearOfPassout: validation_1.commonSchemas.number().integer().min(2000).max(new Date().getFullYear() + 5).optional(),
        cgpaOrPercentage: validation_1.commonSchemas.number().min(0).max(100).optional(),
        collegeName: validation_1.commonSchemas.string().allow('', null).max(200).optional(),
        // Additional fields
        dateOfBirth: validation_1.commonSchemas.date.optional(),
        skills: validation_1.commonSchemas.string().allow('', null).max(500).optional(),
        resumeUrl: validation_1.commonSchemas.uri().allow('', null).optional(),
        linkedinUrl: validation_1.commonSchemas.uri().allow('', null).optional(),
        githubUrl: validation_1.commonSchemas.uri().allow('', null).optional()
    })
}), userController_1.updateCurrentUserProfile);
// Get user profile by ID (admin or own profile)
router.get('/profile/:userId', userController_1.getUserProfile);
// Update user profile (user can update their own profile)
router.put('/profile/:userId', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        name: validation_1.commonSchemas.string().min(2).max(100).optional(),
        mobile: validation_1.commonSchemas.phoneNumber.optional(),
        // Profile fields
        dateOfBirth: validation_1.commonSchemas.date.optional(),
        gender: validation_1.commonSchemas.string().valid('male', 'female', 'other').optional(),
        // Education fields
        highestQualification: validation_1.commonSchemas.string().max(100).optional(),
        stream: validation_1.commonSchemas.string().max(100).optional(),
        college: validation_1.commonSchemas.string().max(200).optional(),
        graduationYear: validation_1.commonSchemas.string().pattern(/^(19|20)\d{2}$/).optional(),
        // Professional fields
        experience: validation_1.commonSchemas.string().max(100).optional(),
        skills: validation_1.commonSchemas.string().max(500).optional(),
        resumeUrl: validation_1.commonSchemas.string().uri().optional(),
        linkedinUrl: validation_1.commonSchemas.string().uri().optional(),
        githubUrl: validation_1.commonSchemas.string().uri().optional(),
        // Custom fields
        customFields: validation_1.commonSchemas.object({}).unknown().optional()
    })
}), userController_1.updateUserProfile);
// Admin-only routes
router.use(jwtAuth_1.requireAdmin);
// Get all users with pagination and filters
router.get('/', (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional(),
        search: validation_1.commonSchemas.string().max(100).optional(),
        status: validation_1.commonSchemas.string().valid('active', 'inactive', 'expired').optional(),
        subscriptionPlan: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').optional()
    })
}), userController_1.getAllUsers);
// Delete user
router.delete('/:userId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        userId: validation_1.commonSchemas.objectId.required()
    })
}), userController_1.deleteUser);
// Get user statistics
router.get('/stats', userController_1.getUserStats);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map