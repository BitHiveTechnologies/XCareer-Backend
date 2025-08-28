import express from 'express';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  applyForJob,
  getUserApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStats
} from '../../controllers/jobs/jobApplicationController';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Apply for a job (requires authentication)
router.post('/:jobId/apply',
  authenticate,
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      resumeUrl: commonSchemas.uri().required(),
      coverLetter: commonSchemas.string().max(2000).optional()
    })
  }),
  applyForJob
);

// Get user's applications (requires authentication)
router.get('/my-applications',
  authenticate,
  validate({
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      status: commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').optional()
    })
  }),
  getUserApplications
);

// Withdraw application (requires authentication)
router.patch('/:applicationId/withdraw',
  authenticate,
  validate({
    params: commonSchemas.object({
      applicationId: commonSchemas.objectId.required()
    })
  }),
  withdrawApplication
);

// Admin-only routes
router.use(requireAdmin);

// Get applications for a specific job
router.get('/job/:jobId/applications',
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    }),
    query: commonSchemas.object({
      page: commonSchemas.pagination.page.optional(),
      limit: commonSchemas.pagination.limit.optional(),
      status: commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').optional()
    })
  }),
  getJobApplications
);

// Update application status
router.patch('/:applicationId/status',
  validate({
    params: commonSchemas.object({
      applicationId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      status: commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').required(),
      adminNotes: commonSchemas.string().max(1000).optional()
    })
  }),
  updateApplicationStatus
);

// Get application statistics
router.get('/stats/overview', getApplicationStats);

export default router;
