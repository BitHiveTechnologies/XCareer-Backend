import { Request, Response } from 'express';
import { Job } from '../../models/Job';
import { JobApplication } from '../../models/JobApplication';
import { logger } from '../../utils/logger';

// Extend Request to include user from Clerk middleware
interface AdminRequest extends Request {
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
 * Get all jobs with pagination and filtering
 */
export const getAllJobs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      type = '',
      location = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get jobs with pagination
    const [jobs, totalJobs] = await Promise.all([
      Job.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('postedBy', 'email firstName lastName')
        .lean(),
      Job.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalJobs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Admin retrieved jobs list', {
      adminId,
      adminRole,
      totalJobs,
      page: pageNum,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalJobs,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all jobs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get jobs'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job details by ID with applications
 */
export const getJobById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { jobId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const [job, applications] = await Promise.all([
      Job.findById(jobId)
        .populate('postedBy', 'email firstName lastName')
        .lean(),
      JobApplication.find({ jobId })
        .populate('userId', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .lean()
    ]);

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

    logger.info('Admin retrieved job details', {
      adminId,
      adminRole,
      targetJobId: jobId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { 
        job,
        applications: {
          total: applications.length,
          list: applications
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job by ID failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetJobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job details'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update job status and moderation
 */
export const updateJobStatus = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { jobId } = req.params;
    const { status, isActive, moderationNotes, isFeatured } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (moderationNotes) {
      updateData.moderationNotes = {
        notes: moderationNotes,
        moderatedBy: adminId,
        moderatedAt: new Date()
      };
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    ).populate('postedBy', 'email firstName lastName');

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

    logger.info('Admin updated job status', {
      adminId,
      adminRole,
      targetJobId: jobId,
      changes: updateData,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { job },
      message: 'Job updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update job status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetJobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update job'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete job (soft delete)
 */
export const deleteJob = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { jobId } = req.params;
    const { reason } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if job exists
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

    // Soft delete - mark as inactive and add deletion timestamp
    await Job.findByIdAndUpdate(jobId, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: adminId,
      deletionReason: reason || 'Admin deletion'
    });

    logger.info('Admin soft deleted job', {
      adminId,
      adminRole,
      targetJobId: jobId,
      reason,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetJobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete job'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Bulk update jobs
 */
export const bulkUpdateJobs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { jobIds, updates } = req.body;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Job IDs array is required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update multiple jobs
    const result = await Job.updateMany(
      { _id: { $in: jobIds } },
      { ...updates, updatedAt: new Date() }
    );

    logger.info('Admin bulk updated jobs', {
      adminId,
      adminRole,
      targetJobIds: jobIds,
      updates,
      modifiedCount: result.modifiedCount,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        totalRequested: jobIds.length
      },
      message: `Successfully updated ${result.modifiedCount} jobs`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bulk update jobs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to bulk update jobs'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job moderation queue
 */
export const getModerationQueue = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      status = 'pending'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get jobs that need moderation
    const filter: any = { status: 'pending' };
    if (status && status !== 'pending') {
      filter.status = status;
    }

    const [jobs, totalJobs] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: 1 }) // Oldest first for moderation queue
        .skip(skip)
        .limit(limitNum)
        .populate('postedBy', 'email firstName lastName')
        .lean(),
      Job.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalJobs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Admin retrieved moderation queue', {
      adminId,
      adminRole,
      status,
      totalJobs,
      page: pageNum,
      limit: limitNum,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalJobs,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get moderation queue failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get moderation queue'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job application analytics
 */
export const getJobApplicationAnalytics = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { jobId } = req.params;

    if (!adminId || !['admin', 'super_admin'].includes(adminRole || '')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get job details
    const job = await Job.findById(jobId).lean();
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

    // Get application statistics
    const applicationStats = await JobApplication.aggregate([
      { $match: { jobId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get application timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationTimeline = await JobApplication.aggregate([
      {
        $match: {
          jobId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get top applicants (by application quality score if available)
    const topApplicants = await JobApplication.find({ jobId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email firstName lastName')
      .lean();

    logger.info('Admin retrieved job application analytics', {
      adminId,
      adminRole,
      targetJobId: jobId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          status: job.status,
          isActive: job.isActive
        },
        applications: {
          total: applicationStats.reduce((sum, stat) => sum + stat.count, 0),
          byStatus: applicationStats
        },
        timeline: applicationTimeline,
        topApplicants
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job application analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      targetJobId: req.params.jobId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job application analytics'
      },
      timestamp: new Date().toISOString()
    });
  }
};
