import { Router } from 'express';
import { 
  getApprovedTestimonials, 
  submitTestimonial, 
  getAllTestimonials, 
  moderateTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
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
router.post('/admin', authenticate, requireAdmin, createTestimonial);
router.put('/:id', authenticate, requireAdmin, updateTestimonial);
router.delete('/:id', authenticate, requireAdmin, deleteTestimonial);

export default router;
