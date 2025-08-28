import { Request, Response } from 'express';
import { JobApplication } from '../../models/JobApplication';
import { Job } from '../../models/Job';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { canAccessPremiumFeatures } from '../../utils/subscriptionService';

/**
 * Apply for a job
 */
export const applyForJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    const { resumeUrl, coverLetter } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Job not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!job.isActive) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job is not active'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if application deadline has passed
    if (new Date() > job.applicationDeadline) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Application deadline has passed'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      userId
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        error: {
          message: 'You have already applied for this job'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check user eligibility based on subscription
    const canAccessPremium = await canAccessPremiumFeatures(userId);
    
    // Basic users can only apply to internships and basic jobs
    if (!canAccessPremium && job.description.includes('premium')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Premium subscription required to apply for this job'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create job application
    const application = new JobApplication({
      jobId,
      userId,
      status: 'applied',
      appliedAt: new Date(),
      resumeUrl,
      coverLetter
    });

    await application.save();

    logger.info('Job application submitted', {
      userId,
      jobId,
      applicationId: application._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: {
          id: application._id,
          jobId: application.jobId,
          status: application.status,
          appliedAt: application.appliedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Apply for job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      jobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to submit application'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user's job applications
 */
export const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // Get applications with job details
    const applications = await JobApplication.find(query)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('jobId', 'title company type location applicationDeadline')
      .populate('userId', 'name email');

    const total = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications: applications.map(app => ({
          id: app._id,
          job: app.jobId,
          status: app.status,
          appliedAt: app.appliedAt,
          resumeUrl: app.resumeUrl,
          coverLetter: app.coverLetter,
          adminNotes: app.adminNotes
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user applications failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get applications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job applications for a specific job (admin only)
 */
export const getJobApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if admin posted this job
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Job not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (job.postedBy.toString() !== adminId) {
      res.status(403).json({
        success: false,
        error: {
          message: 'You can only view applications for jobs you posted'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { jobId };
    if (status) {
      query.status = status;
    }

    // Get applications
    const applications = await JobApplication.find(query)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email profile')
      .populate('jobId', 'title company type');

    const total = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications: applications.map(app => ({
          id: app._id,
          user: app.userId,
          job: app.jobId,
          status: app.status,
          appliedAt: app.appliedAt,
          resumeUrl: app.resumeUrl,
          coverLetter: app.coverLetter,
          adminNotes: app.adminNotes
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job applications failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      jobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job applications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update application status (admin only)
 */
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find application
    const application = await JobApplication.findById(applicationId)
      .populate('jobId', 'postedBy');

    if (!application) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Application not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if admin posted the job
    if ((application.jobId as any).postedBy.toString() !== adminId) {
      res.status(403).json({
        success: false,
        error: {
          message: 'You can only update applications for jobs you posted'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update application
    application.status = status;
    if (adminNotes) {
      application.adminNotes = adminNotes;
    }

    await application.save();

    logger.info('Application status updated', {
      adminId,
      applicationId,
      newStatus: status,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: {
          id: application._id,
          status: application.status,
          adminNotes: application.adminNotes,
          updatedAt: application.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update application status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      applicationId: req.params.applicationId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update application status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Withdraw application
 */
export const withdrawApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { applicationId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Application not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check ownership
    if (application.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: {
          message: 'You can only withdraw your own applications'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if application can be withdrawn
    if (application.status === 'withdrawn') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Application has already been withdrawn'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (application.status === 'shortlisted' || application.status === 'rejected') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Cannot withdraw application that has been processed'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update status
    application.status = 'withdrawn';
    await application.save();

    logger.info('Application withdrawn', {
      userId,
      applicationId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        application: {
          id: application._id,
          status: application.status,
          updatedAt: application.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Withdraw application failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      applicationId: req.params.applicationId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to withdraw application'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get application statistics (admin only)
 */
export const getApplicationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get overall statistics
    const totalApplications = await JobApplication.countDocuments();
    const appliedApplications = await JobApplication.countDocuments({ status: 'applied' });
    const shortlistedApplications = await JobApplication.countDocuments({ status: 'shortlisted' });
    const rejectedApplications = await JobApplication.countDocuments({ status: 'rejected' });
    const withdrawnApplications = await JobApplication.countDocuments({ status: 'withdrawn' });

    // Get applications for jobs posted by this admin
    const adminJobs = await Job.find({ postedBy: adminId }).select('_id');
    const adminJobIds = adminJobs.map(job => job._id);

    const adminTotalApplications = await JobApplication.countDocuments({
      jobId: { $in: adminJobIds }
    });

    const adminApplied = await JobApplication.countDocuments({
      jobId: { $in: adminJobIds },
      status: 'applied'
    });

    const adminShortlisted = await JobApplication.countDocuments({
      jobId: { $in: adminJobIds },
      status: 'shortlisted'
    });

    const adminRejected = await JobApplication.countDocuments({
      jobId: { $in: adminJobIds },
      status: 'rejected'
    });

    // Get monthly application trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await JobApplication.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          jobId: { $in: adminJobIds }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalApplications,
          appliedApplications,
          shortlistedApplications,
          rejectedApplications,
          withdrawnApplications
        },
        admin: {
          totalApplications: adminTotalApplications,
          applied: adminApplied,
          shortlisted: adminShortlisted,
          rejected: adminRejected
        },
        monthlyTrends
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get application stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get application statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};
