import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { emailService } from '../../utils/emailService';
import { emailQueueService } from '../../utils/emailQueue';
import { User } from '../../models/User';
import { Job } from '../../models/Job';

// Extend Request to include user from Clerk middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'user' | 'admin' | 'super_admin';
    type: 'user' | 'admin';
    clerkUserId: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Email and name are required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add email job to queue
    const job = await emailQueueService.addEmailJob({
      to: email,
      subject: 'Welcome to NotifyX!',
      template: 'welcome',
      context: { name }
    });

    if (job) {
      logger.info('Welcome email queued successfully', {
        jobId: job.id,
        email,
        name
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Welcome email queued successfully',
          jobId: job.id
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to queue welcome email'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Send welcome email failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send welcome email'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send job alert email to user
 */
export const sendJobAlertEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, jobId } = req.body;

    if (!userId || !jobId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User ID and job ID are required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get user and job details
    const [user, job] = await Promise.all([
      User.findById(userId),
      Job.findById(jobId)
    ]);

    if (!user || !job) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User or job not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add email job to queue
    const emailJob = await emailQueueService.addEmailJob({
      to: user.email,
      subject: `New Job Opportunity: ${job.title}`,
      template: 'job-alert',
      context: {
        jobTitle: job.title,
        companyName: job.company,
        location: job.location,
        jobType: job.type,
        description: job.description,
        applicationLink: job.applicationLink
      }
    });

    if (emailJob) {
      logger.info('Job alert email queued successfully', {
        emailJobId: emailJob.id,
        userId: user._id,
        jobId: job._id,
        email: user.email
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Job alert email queued successfully',
          jobId: emailJob.id
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to queue job alert email'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Send job alert email failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.body.userId,
      jobId: req.body.jobId
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send job alert email'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get email queue status
 */
export const getEmailQueueStatus = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = await emailQueueService.getQueueStatus();

    res.status(200).json({
      success: true,
      data: {
        queueStatus: status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get email queue status failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get email queue status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Test email service connection
 */
export const testEmailConnection = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isConnected = await emailService.verifyConnection();

    if (isConnected) {
      res.status(200).json({
        success: true,
        data: {
          message: 'Email service connection successful',
          status: 'connected'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Email service connection failed',
          status: 'disconnected'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Test email connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Email service connection test failed'
      },
      timestamp: new Date().toISOString()
    });
  }
};
