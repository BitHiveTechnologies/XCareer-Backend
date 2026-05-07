import { Router } from 'express';
import { 
  getApprovedTestimonials, 
  submitTestimonial, 
  getAllTestimonials, 
  moderateTestimonial 
} from '../controllers/testimonialController';
import { authenticate, requireAdmin } from '../middleware/jwtAuth';

const router = Router();

// Public routes
router.get('/', getApprovedTestimonials);

// Protected routes (for users to submit)
router.post('/', authenticate, submitTestimonial);

// Admin routes
router.get('/admin', authenticate, requireAdmin, getAllTestimonials);
router.patch('/:id/moderate', authenticate, requireAdmin, moderateTestimonial);

export default router;
