"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resumeController_1 = require("../controllers/resumeController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/resumes/my-resume
 * @desc    Get current user's resume
 * @access  Private
 */
router.get('/my-resume', jwtAuth_1.authenticate, resumeController_1.getMyResume);
/**
 * @route   POST /api/v1/resumes/my-resume
 * @desc    Create or update user's resume
 * @access  Private
 */
router.post('/my-resume', jwtAuth_1.authenticate, resumeController_1.saveResume);
/**
 * @route   GET /api/v1/resumes/public/:resumeId
 * @desc    Get a public resume by ID
 * @access  Public
 */
router.get('/public/:resumeId', resumeController_1.getPublicResume);
exports.default = router;
//# sourceMappingURL=resumeRoutes.js.map