"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const jobMatchingController_1 = require("../../controllers/jobs/jobMatchingController");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
/**
 * @route   GET /api/v1/matching/jobs
 * @desc    Get matching jobs for authenticated user
 * @access  Private
 */
router.get('/jobs', auth_1.authenticate, jobMatchingController_1.getMatchingJobs);
/**
 * @route   GET /api/v1/matching/jobs/:jobId/users
 * @desc    Get matching users for a specific job (admin only)
 * @access  Private (Admin)
 */
router.get('/jobs/:jobId/users', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({ params: joi_1.default.object({ jobId: validation_2.commonSchemas.objectId }) }), jobMatchingController_1.getMatchingUsers);
/**
 * @route   POST /api/v1/matching/recommendations
 * @desc    Get personalized job recommendations for user
 * @access  Private
 */
router.post('/recommendations', auth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        preferredJobTypes: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string().valid('job', 'internship')),
        preferredLocations: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string().valid('remote', 'onsite', 'hybrid')),
        minMatchScore: validation_2.commonSchemas.number().min(0).max(100),
        maxResults: validation_2.commonSchemas.number().min(1).max(100)
    })
}), jobMatchingController_1.getJobRecommendationsForUser);
/**
 * @route   GET /api/v1/matching/stats
 * @desc    Get job matching statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', auth_1.authenticate, auth_1.requireAdmin, jobMatchingController_1.getMatchingStats);
/**
 * @route   POST /api/v1/matching/advanced
 * @desc    Get advanced job matching with filters and sorting (admin only)
 * @access  Private (Admin)
 */
router.post('/advanced', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    body: joi_1.default.object({
        jobTypes: joi_1.default.array().items(joi_1.default.string().valid('job', 'internship')),
        locations: joi_1.default.array().items(joi_1.default.string().valid('remote', 'onsite', 'hybrid')),
        qualifications: joi_1.default.array().items(joi_1.default.string()),
        streams: joi_1.default.array().items(joi_1.default.string()),
        minSalary: joi_1.default.number().min(0),
        maxSalary: joi_1.default.number().min(0),
        experienceLevel: joi_1.default.string(),
        limit: joi_1.default.number().min(1).max(100),
        offset: joi_1.default.number().min(0),
        sortBy: joi_1.default.string().valid('relevance', 'date', 'salary')
    })
}), jobMatchingController_1.getAdvancedJobMatching);
exports.default = router;
//# sourceMappingURL=jobMatchingRoutes.js.map