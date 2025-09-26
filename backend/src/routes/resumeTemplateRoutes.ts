import express from 'express';
import {
    downloadTemplate,
    getAllTemplates,
    getPopularTemplates,
    getTemplateById,
    getTemplatesByCategory,
    getTemplatesByExperienceLevel,
    getTemplatesByIndustry,
    rateTemplate
} from '../controllers/resumeTemplateController';
import { authenticate, optionalAuth } from '../middleware/jwtAuth';
import { commonSchemas, validate } from '../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/popular', getPopularTemplates);
router.get('/category/:category', getTemplatesByCategory);
router.get('/industry/:industry', getTemplatesByIndustry);
router.get('/experience/:level', getTemplatesByExperienceLevel);

// Get all templates (with optional authentication for subscription filtering)
router.get('/',
  optionalAuth,
  validate({
    query: commonSchemas.object({
      category: commonSchemas.string().valid('professional', 'creative', 'academic', 'technical', 'executive').optional(),
      industry: commonSchemas.string().optional(),
      experienceLevel: commonSchemas.string().valid('entry', 'mid', 'senior', 'executive').optional(),
      subscriptionTier: commonSchemas.string().valid('basic', 'premium', 'enterprise').optional(),
      tags: commonSchemas.string().optional(),
      search: commonSchemas.string().optional(),
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      sortBy: commonSchemas.string().valid('downloadCount', 'rating', 'createdAt').optional(),
      sortOrder: commonSchemas.string().valid('asc', 'desc').optional()
    })
  }),
  getAllTemplates
);

// Get specific template by ID (with optional authentication for subscription filtering)
router.get('/:templateId',
  optionalAuth,
  validate({
    params: commonSchemas.object({
      templateId: commonSchemas.objectId.required()
    })
  }),
  getTemplateById
);

// Protected routes (authentication required)
router.post('/:templateId/download',
  authenticate,
  validate({
    params: commonSchemas.object({
      templateId: commonSchemas.objectId.required()
    })
  }),
  downloadTemplate
);

router.post('/:templateId/rate',
  authenticate,
  validate({
    params: commonSchemas.object({
      templateId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      rating: commonSchemas.number().min(1).max(5).required()
    })
  }),
  rateTemplate
);

export default router;
