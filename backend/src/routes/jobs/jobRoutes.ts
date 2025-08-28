import express from 'express';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getJobStats,
  searchJobs
} from '../../controllers/jobs/jobController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/:jobId', getJobById);

// Protected routes (require authentication)
router.use(authenticate);

// Admin-only routes
router.use(requireAdmin);

// Create job
router.post('/',
  validate({
    body: commonSchemas.object({
      title: commonSchemas.string().min(5).max(200).required(),
      company: commonSchemas.string().min(2).max(100).required(),
      description: commonSchemas.string().min(20).max(5000).required(),
      type: commonSchemas.string().valid('job', 'internship').required(),
      eligibility: commonSchemas.object({
        qualifications: commonSchemas.array().items(commonSchemas.string()).min(1).required(),
        streams: commonSchemas.array().items(commonSchemas.string()).min(1).required(),
        passoutYears: commonSchemas.array().items(commonSchemas.number().integer().min(2020).max(2030)).min(1).required(),
        minCGPA: commonSchemas.number().min(0).max(10).optional()
      }).required(),
      applicationDeadline: commonSchemas.date.min(new Date().toISOString()).required(),
      applicationLink: commonSchemas.uri().required(),
      location: commonSchemas.string().valid('remote', 'onsite', 'hybrid').required(),
      salary: commonSchemas.string().max(100).optional(),
      stipend: commonSchemas.string().max(100).optional()
    })
  }),
  createJob
);

// Update job
router.put('/:jobId',
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      title: commonSchemas.string().min(5).max(200).optional(),
      company: commonSchemas.string().min(2).max(100).optional(),
      description: commonSchemas.string().min(20).max(5000).optional(),
      type: commonSchemas.string().valid('job', 'internship').optional(),
      eligibility: commonSchemas.object({
        qualifications: commonSchemas.array().items(commonSchemas.string()).min(1).optional(),
        streams: commonSchemas.array().items(commonSchemas.string()).min(1).optional(),
        passoutYears: commonSchemas.array().items(commonSchemas.number().integer().min(2020).max(2030)).min(1).optional(),
        minCGPA: commonSchemas.number().min(0).max(10).optional()
      }).optional(),
      applicationDeadline: commonSchemas.date.min(new Date().toISOString()).optional(),
      applicationLink: commonSchemas.uri().optional(),
      location: commonSchemas.string().valid('remote', 'onsite', 'hybrid').optional(),
      salary: commonSchemas.string().max(100).optional(),
      stipend: commonSchemas.string().max(100).optional()
    })
  }),
  updateJob
);

// Delete job
router.delete('/:jobId',
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    })
  }),
  deleteJob
);

// Toggle job status
router.patch('/:jobId/toggle-status',
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    })
  }),
  toggleJobStatus
);

// Get job statistics
router.get('/stats/overview', getJobStats);

export default router;
