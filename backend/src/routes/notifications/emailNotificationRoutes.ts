import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/jwtAuth';
import {
  sendWelcomeEmail,
  sendJobAlertEmail,
  getEmailQueueStatus,
  testEmailConnection
} from '../../controllers/notifications/emailNotificationController';
import { validate } from '../../middleware/validation';
import { commonSchemas } from '../../middleware/validation';

const router = express.Router();

// Apply authentication to all notification routes
router.use(authenticate);

// Send welcome email (admin only)
router.post('/welcome',
  requireAdmin,
  validate({
    body: commonSchemas.object({
      email: commonSchemas.email.required(),
      name: commonSchemas.string().min(2).max(100).required()
    })
  }),
  sendWelcomeEmail
);

// Send job alert email (admin only)
router.post('/job-alert',
  requireAdmin,
  validate({
    body: commonSchemas.object({
      userId: commonSchemas.objectId.required(),
      jobId: commonSchemas.objectId.required()
    })
  }),
  sendJobAlertEmail
);

// Get email queue status (admin only)
router.get('/queue-status',
  requireAdmin,
  getEmailQueueStatus
);

// Test email connection (admin only)
router.get('/test-connection',
  requireAdmin,
  testEmailConnection
);

export default router;
