import express from 'express';
import Joi from 'joi';
import {
  getMatchingJobs,
  getMatchingUsers,
  getJobRecommendationsForUser,
  getMatchingStats,
  getAdvancedJobMatching
} from '../../controllers/jobs/jobMatchingController';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

/**
 * @route   GET /api/v1/matching/jobs
 * @desc    Get matching jobs for authenticated user
 * @access  Private
 */
router.get('/jobs', 
  authenticate,
  getMatchingJobs
);

/**
 * @route   GET /api/v1/matching/jobs/:jobId/users
 * @desc    Get matching users for a specific job (admin only)
 * @access  Private (Admin)
 */
router.get('/jobs/:jobId/users',
  authenticate,
  requireAdmin,
  validate({ params: Joi.object({ jobId: commonSchemas.objectId }) }),
  getMatchingUsers
);

/**
 * @route   POST /api/v1/matching/recommendations
 * @desc    Get personalized job recommendations for user
 * @access  Private
 */
router.post('/recommendations',
  authenticate,
  validate({
    body: Joi.object({
      preferredJobTypes: commonSchemas.array().items(commonSchemas.string().valid('job', 'internship')),
      preferredLocations: commonSchemas.array().items(commonSchemas.string().valid('remote', 'onsite', 'hybrid')),
      minMatchScore: commonSchemas.number().min(0).max(100),
      maxResults: commonSchemas.number().min(1).max(100)
    })
  }),
  getJobRecommendationsForUser
);

/**
 * @route   GET /api/v1/matching/stats
 * @desc    Get job matching statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats',
  authenticate,
  requireAdmin,
  getMatchingStats
);

/**
 * @route   POST /api/v1/matching/advanced
 * @desc    Get advanced job matching with filters and sorting (admin only)
 * @access  Private (Admin)
 */
router.post('/advanced',
  authenticate,
  requireAdmin,
  validate({
    body: Joi.object({
      jobTypes: Joi.array().items(Joi.string().valid('job', 'internship')),
      locations: Joi.array().items(Joi.string().valid('remote', 'onsite', 'hybrid')),
      qualifications: Joi.array().items(Joi.string()),
      streams: Joi.array().items(Joi.string()),
      minSalary: Joi.number().min(0),
      maxSalary: Joi.number().min(0),
      experienceLevel: Joi.string(),
      limit: Joi.number().min(1).max(100),
      offset: Joi.number().min(0),
      sortBy: Joi.string().valid('relevance', 'date', 'salary')
    })
  }),
  getAdvancedJobMatching
);

export default router;
