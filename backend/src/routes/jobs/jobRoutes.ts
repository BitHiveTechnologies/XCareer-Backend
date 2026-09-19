import express, { Request, Response, NextFunction } from 'express';
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

/** Date-only picker values ("YYYY-MM-DD") fail Joi.date().iso().greater('now') at UTC midnight. */
const coerceJobPayload = (req: Request, _res: Response, next: NextFunction): void => {
  const deadline = req.body?.applicationDeadline;
  if (typeof deadline === 'string') {
    const trimmed = deadline.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      req.body.applicationDeadline = `${trimmed}T23:59:59.000Z`;
    }
  }

  const years = req.body?.eligibility?.passoutYears;
  if (Array.isArray(years)) {
    req.body.eligibility.passoutYears = years.map((year: unknown) =>
      typeof year === 'string' && year.trim() !== '' ? Number(year) : year
    );
  }

  next();
};

const eligibilityFields = {
  qualifications: commonSchemas.array().items(commonSchemas.string().trim().min(1)).min(1),
  streams: commonSchemas.array().items(commonSchemas.string().trim().min(1)).min(1),
  passoutYears: commonSchemas.array().items(commonSchemas.number().integer().min(2000).max(2030)).min(1),
  minCGPA: commonSchemas.number().min(0).max(10).optional()
};

const jobWriteFields = {
  title: commonSchemas.string().trim().min(2).max(200),
  company: commonSchemas.string().trim().min(2).max(150),
  description: commonSchemas.string().trim().min(20).max(5000),
  type: commonSchemas.string().valid('job', 'internship'),
  eligibility: commonSchemas.object({
    qualifications: eligibilityFields.qualifications.required(),
    streams: eligibilityFields.streams.required(),
    passoutYears: eligibilityFields.passoutYears.required(),
    minCGPA: eligibilityFields.minCGPA
  }),
  eligibilityPartial: commonSchemas.object({
    qualifications: eligibilityFields.qualifications.optional(),
    streams: eligibilityFields.streams.optional(),
    passoutYears: eligibilityFields.passoutYears.optional(),
    minCGPA: eligibilityFields.minCGPA
  }),
  // 'now' is evaluated per request. Frozen new Date().toISOString() at module load was too strict
  // for today's date-picker values and drifted as the process stayed up.
  applicationDeadline: commonSchemas.date.greater('now'),
  applicationLink: commonSchemas.string().trim().pattern(/^https?:\/\/.+/).messages({
    'string.pattern.base': 'Application link must start with http:// or https://'
  }),
  location: commonSchemas.string().valid('remote', 'onsite', 'hybrid'),
  salary: commonSchemas.string().max(100).allow('').optional(),
  stipend: commonSchemas.string().max(100).allow('').optional(),
  companyLogoUrl: commonSchemas.string().trim().max(500).allow('', null).optional()
};

// Public routes (no authentication required)
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/stats/overview', getJobStats);
router.get('/:jobId', getJobById);

// Admin-only routes (require authentication + admin privileges)
router.use(authenticate);
router.use(requireAdmin);

// Create job
router.post('/',
  coerceJobPayload,
  validate({
    body: commonSchemas.object({
      title: jobWriteFields.title.required(),
      company: jobWriteFields.company.required(),
      description: jobWriteFields.description.required(),
      type: jobWriteFields.type.required(),
      eligibility: jobWriteFields.eligibility.required(),
      applicationDeadline: jobWriteFields.applicationDeadline.required(),
      applicationLink: jobWriteFields.applicationLink.required(),
      location: jobWriteFields.location.required(),
      salary: jobWriteFields.salary,
      stipend: jobWriteFields.stipend,
      companyLogoUrl: jobWriteFields.companyLogoUrl
    })
  }),
  createJob
);

// Update job
router.put('/:jobId',
  coerceJobPayload,
  validate({
    params: commonSchemas.object({
      jobId: commonSchemas.objectId.required()
    }),
    body: commonSchemas.object({
      title: jobWriteFields.title.optional(),
      company: jobWriteFields.company.optional(),
      description: jobWriteFields.description.optional(),
      type: jobWriteFields.type.optional(),
      eligibility: jobWriteFields.eligibilityPartial.optional(),
      applicationDeadline: jobWriteFields.applicationDeadline.optional(),
      applicationLink: jobWriteFields.applicationLink.optional(),
      location: jobWriteFields.location.optional(),
      salary: jobWriteFields.salary,
      stipend: jobWriteFields.stipend,
      companyLogoUrl: jobWriteFields.companyLogoUrl
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

export default router;
