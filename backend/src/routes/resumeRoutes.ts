import { Router } from 'express';
import { getMyResume, saveResume, getPublicResume } from '../controllers/resumeController';
import { authenticate } from '../middleware/jwtAuth';

const router = Router();

/**
 * @route   GET /api/v1/resumes/my-resume
 * @desc    Get current user's resume
 * @access  Private
 */
router.get('/my-resume', authenticate, getMyResume);

/**
 * @route   POST /api/v1/resumes/my-resume
 * @desc    Create or update user's resume
 * @access  Private
 */
router.post('/my-resume', authenticate, saveResume);

/**
 * @route   GET /api/v1/resumes/public/:resumeId
 * @desc    Get a public resume by ID
 * @access  Public
 */
router.get('/public/:resumeId', getPublicResume);

export default router;
