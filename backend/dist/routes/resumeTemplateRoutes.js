"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeTemplateController_1 = require("../controllers/resumeTemplateController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/popular', resumeTemplateController_1.getPopularTemplates);
router.get('/category/:category', resumeTemplateController_1.getTemplatesByCategory);
router.get('/industry/:industry', resumeTemplateController_1.getTemplatesByIndustry);
router.get('/experience/:level', resumeTemplateController_1.getTemplatesByExperienceLevel);
// Get all templates (with optional authentication for subscription filtering)
router.get('/', jwtAuth_1.optionalAuth, (0, validation_1.validate)({
    query: validation_1.commonSchemas.object({
        category: validation_1.commonSchemas.string().valid('professional', 'creative', 'academic', 'technical', 'executive').optional(),
        industry: validation_1.commonSchemas.string().optional(),
        experienceLevel: validation_1.commonSchemas.string().valid('entry', 'mid', 'senior', 'executive').optional(),
        subscriptionTier: validation_1.commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
        tags: validation_1.commonSchemas.string().optional(),
        search: validation_1.commonSchemas.string().optional(),
        page: validation_1.commonSchemas.pagination.page.optional(),
        limit: validation_1.commonSchemas.pagination.limit.optional(),
        sortBy: validation_1.commonSchemas.string().valid('downloadCount', 'rating', 'createdAt').optional(),
        sortOrder: validation_1.commonSchemas.string().valid('asc', 'desc').optional()
    })
}), resumeTemplateController_1.getAllTemplates);
// Get specific template by ID (with optional authentication for subscription filtering)
router.get('/:templateId', jwtAuth_1.optionalAuth, (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        templateId: validation_1.commonSchemas.objectId.required()
    })
}), resumeTemplateController_1.getTemplateById);
// Protected routes (authentication required)
router.post('/:templateId/download', jwtAuth_1.authenticate, (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        templateId: validation_1.commonSchemas.objectId.required()
    })
}), resumeTemplateController_1.downloadTemplate);
router.post('/:templateId/rate', jwtAuth_1.authenticate, (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        templateId: validation_1.commonSchemas.objectId.required()
    }),
    body: validation_1.commonSchemas.object({
        rating: validation_1.commonSchemas.number().min(1).max(5).required()
    })
}), resumeTemplateController_1.rateTemplate);
exports.default = router;
//# sourceMappingURL=resumeTemplateRoutes.js.map