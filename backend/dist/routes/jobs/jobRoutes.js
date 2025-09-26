"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../../controllers/jobs/jobController");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/', jobController_1.getAllJobs);
router.get('/search', jobController_1.searchJobs);
router.get('/:jobId', jobController_1.getJobById);
// Admin-only routes (require authentication + admin privileges)
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
// Admin-only stats endpoint
router.get('/stats/overview', jobController_1.getJobStats);
// Create job
router.post('/', (0, validation_1.validate)({
    body: validation_1.commonSchemas.object({
        title: validation_1.commonSchemas.string().min(5).max(200).required(),
        company: validation_1.commonSchemas.string().min(2).max(100).required(),
        description: validation_1.commonSchemas.string().min(20).max(5000).required(),
        type: validation_1.commonSchemas.string().valid('job', 'internship').required(),
        eligibility: validation_1.commonSchemas.object({
            qualifications: validation_1.commonSchemas.array().items(validation_1.commonSchemas.string()).min(1).required(),
            streams: validation_1.commonSchemas.array().items(validation_1.commonSchemas.string()).min(1).required(),
            passoutYears: validation_1.commonSchemas.array().items(validation_1.commonSchemas.number().integer().min(2020).max(2030)).min(1).required(),
            minCGPA: validation_1.commonSchemas.number().min(0).max(10).optional()
        }).required(),
        applicationDeadline: validation_1.commonSchemas.date.min(new Date().toISOString()).required(),
        applicationLink: validation_1.commonSchemas.uri().required(),
        location: validation_1.commonSchemas.string().valid('remote', 'onsite', 'hybrid').required(),
        salary: validation_1.commonSchemas.string().max(100).optional(),
        stipend: validation_1.commonSchemas.string().max(100).optional()
    })
}), jobController_1.createJob);
// Update job
router.put('/:jobId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.required()
    }),
    body: validation_1.commonSchemas.object({
        title: validation_1.commonSchemas.string().min(5).max(200).optional(),
        company: validation_1.commonSchemas.string().min(2).max(100).optional(),
        description: validation_1.commonSchemas.string().min(20).max(5000).optional(),
        type: validation_1.commonSchemas.string().valid('job', 'internship').optional(),
        eligibility: validation_1.commonSchemas.object({
            qualifications: validation_1.commonSchemas.array().items(validation_1.commonSchemas.string()).min(1).optional(),
            streams: validation_1.commonSchemas.array().items(validation_1.commonSchemas.string()).min(1).optional(),
            passoutYears: validation_1.commonSchemas.array().items(validation_1.commonSchemas.number().integer().min(2020).max(2030)).min(1).optional(),
            minCGPA: validation_1.commonSchemas.number().min(0).max(10).optional()
        }).optional(),
        applicationDeadline: validation_1.commonSchemas.date.min(new Date().toISOString()).optional(),
        applicationLink: validation_1.commonSchemas.uri().optional(),
        location: validation_1.commonSchemas.string().valid('remote', 'onsite', 'hybrid').optional(),
        salary: validation_1.commonSchemas.string().max(100).optional(),
        stipend: validation_1.commonSchemas.string().max(100).optional()
    })
}), jobController_1.updateJob);
// Delete job
router.delete('/:jobId', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.required()
    })
}), jobController_1.deleteJob);
// Toggle job status
router.patch('/:jobId/toggle-status', (0, validation_1.validate)({
    params: validation_1.commonSchemas.object({
        jobId: validation_1.commonSchemas.objectId.required()
    })
}), jobController_1.toggleJobStatus);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map