"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../middleware/validation");
const auth_1 = require("../../middleware/auth");
const jobApplicationController_1 = require("../../controllers/jobs/jobApplicationController");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Apply for a job (requires authentication)
router.post('/:jobId/apply', auth_1.authenticate, (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        jobId: validation_2.commonSchemas.objectId.required()
    }),
    body: validation_2.commonSchemas.object({
        resumeUrl: validation_2.commonSchemas.uri().required(),
        coverLetter: validation_2.commonSchemas.string().max(2000).optional()
    })
}), jobApplicationController_1.applyForJob);
// Get user's applications (requires authentication)
router.get('/my-applications', auth_1.authenticate, (0, validation_1.validate)({
    query: validation_2.commonSchemas.object({
        page: validation_2.commonSchemas.pagination.page.optional(),
        limit: validation_2.commonSchemas.pagination.limit.optional(),
        status: validation_2.commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').optional()
    })
}), jobApplicationController_1.getUserApplications);
// Withdraw application (requires authentication)
router.patch('/:applicationId/withdraw', auth_1.authenticate, (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        applicationId: validation_2.commonSchemas.objectId.required()
    })
}), jobApplicationController_1.withdrawApplication);
// Admin-only routes
router.use(auth_1.requireAdmin);
// Get applications for a specific job
router.get('/job/:jobId/applications', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        jobId: validation_2.commonSchemas.objectId.required()
    }),
    query: validation_2.commonSchemas.object({
        page: validation_2.commonSchemas.pagination.page.optional(),
        limit: validation_2.commonSchemas.pagination.limit.optional(),
        status: validation_2.commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').optional()
    })
}), jobApplicationController_1.getJobApplications);
// Update application status
router.patch('/:applicationId/status', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        applicationId: validation_2.commonSchemas.objectId.required()
    }),
    body: validation_2.commonSchemas.object({
        status: validation_2.commonSchemas.string().valid('applied', 'shortlisted', 'rejected', 'withdrawn').required(),
        adminNotes: validation_2.commonSchemas.string().max(1000).optional()
    })
}), jobApplicationController_1.updateApplicationStatus);
// Get application statistics
router.get('/stats/overview', jobApplicationController_1.getApplicationStats);
exports.default = router;
//# sourceMappingURL=jobApplicationRoutes.js.map