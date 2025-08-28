"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../middleware/validation");
const auth_1 = require("../../middleware/auth");
const jobController_1 = require("../../controllers/jobs/jobController");
const validation_2 = require("../../middleware/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/', jobController_1.getAllJobs);
router.get('/search', jobController_1.searchJobs);
router.get('/:jobId', jobController_1.getJobById);
// Protected routes (require authentication)
router.use(auth_1.authenticate);
// Admin-only routes
router.use(auth_1.requireAdmin);
// Create job
router.post('/', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        title: validation_2.commonSchemas.string().min(5).max(200).required(),
        company: validation_2.commonSchemas.string().min(2).max(100).required(),
        description: validation_2.commonSchemas.string().min(20).max(5000).required(),
        type: validation_2.commonSchemas.string().valid('job', 'internship').required(),
        eligibility: validation_2.commonSchemas.object({
            qualifications: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string()).min(1).required(),
            streams: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string()).min(1).required(),
            passoutYears: validation_2.commonSchemas.array().items(validation_2.commonSchemas.number().integer().min(2020).max(2030)).min(1).required(),
            minCGPA: validation_2.commonSchemas.number().min(0).max(10).optional()
        }).required(),
        applicationDeadline: validation_2.commonSchemas.date.min(new Date().toISOString()).required(),
        applicationLink: validation_2.commonSchemas.uri().required(),
        location: validation_2.commonSchemas.string().valid('remote', 'onsite', 'hybrid').required(),
        salary: validation_2.commonSchemas.string().max(100).optional(),
        stipend: validation_2.commonSchemas.string().max(100).optional()
    })
}), jobController_1.createJob);
// Update job
router.put('/:jobId', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        jobId: validation_2.commonSchemas.objectId.required()
    }),
    body: validation_2.commonSchemas.object({
        title: validation_2.commonSchemas.string().min(5).max(200).optional(),
        company: validation_2.commonSchemas.string().min(2).max(100).optional(),
        description: validation_2.commonSchemas.string().min(20).max(5000).optional(),
        type: validation_2.commonSchemas.string().valid('job', 'internship').optional(),
        eligibility: validation_2.commonSchemas.object({
            qualifications: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string()).min(1).optional(),
            streams: validation_2.commonSchemas.array().items(validation_2.commonSchemas.string()).min(1).optional(),
            passoutYears: validation_2.commonSchemas.array().items(validation_2.commonSchemas.number().integer().min(2020).max(2030)).min(1).optional(),
            minCGPA: validation_2.commonSchemas.number().min(0).max(10).optional()
        }).optional(),
        applicationDeadline: validation_2.commonSchemas.date.min(new Date().toISOString()).optional(),
        applicationLink: validation_2.commonSchemas.uri().optional(),
        location: validation_2.commonSchemas.string().valid('remote', 'onsite', 'hybrid').optional(),
        salary: validation_2.commonSchemas.string().max(100).optional(),
        stipend: validation_2.commonSchemas.string().max(100).optional()
    })
}), jobController_1.updateJob);
// Delete job
router.delete('/:jobId', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        jobId: validation_2.commonSchemas.objectId.required()
    })
}), jobController_1.deleteJob);
// Toggle job status
router.patch('/:jobId/toggle-status', (0, validation_1.validate)({
    params: validation_2.commonSchemas.object({
        jobId: validation_2.commonSchemas.objectId.required()
    })
}), jobController_1.toggleJobStatus);
// Get job statistics
router.get('/stats/overview', jobController_1.getJobStats);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map