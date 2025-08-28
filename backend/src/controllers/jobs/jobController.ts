import { Request, Response } from 'express';
import { Job } from '../../models/Job';
import { logger } from '../../utils/logger';
import { canAccessPremiumFeatures, canAccessEnterpriseFeatures } from '../../utils/subscriptionService';

/**
 * Create a new job posting
 */
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const {
      title,
      company,
      description,
      type,
      eligibility,
      applicationDeadline,
      applicationLink,
      location,
      salary,
      stipend
    } = req.body;

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

    // Create new job
    const newJob = new Job({
      title,
      company,
      description,
      type,
      eligibility,
      applicationDeadline: new Date(applicationDeadline),
      applicationLink,
      location,
      salary,
      stipend,
      isActive: true,
      postedBy: adminId
    });

    await newJob.save();

    logger.info('Job created successfully', {
      adminId,
      jobId: newJob._id,
      title,
      company,
      type,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: {
        job: {
          id: newJob._id,
          title: newJob.title,
          company: newJob.company,
          type: newJob.type,
          location: newJob.location,
          isActive: newJob.isActive,
          createdAt: newJob.createdAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create job'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all jobs with filtering and pagination
 */
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      location,
      qualification,
      stream,
      yearOfPassout,
      minCGPA,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { isActive: true };
    
    if (type) query.type = type;
    if (location) query.location = location;
    if (qualification) query['eligibility.qualifications'] = qualification;
    if (stream) query['eligibility.streams'] = stream;
    if (yearOfPassout) query['eligibility.passoutYears'] = parseInt(yearOfPassout as string);
    if (minCGPA) query['eligibility.minCGPA'] = { $lte: parseFloat(minCGPA as string) };
    
    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get jobs
    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('postedBy', 'name email');

    const total = await Job.countDocuments(query);

    // Filter jobs based on user subscription (if authenticated)
    const userId = req.user?.id;
    let filteredJobs = jobs;

    if (userId) {
      const canAccessPremium = await canAccessPremiumFeatures(userId);
      const canAccessEnterprise = await canAccessEnterpriseFeatures(userId);

      filteredJobs = jobs.filter(job => {
        // Basic jobs are always accessible
        if (job.type === 'internship') return true;
        
        // Premium features for premium/enterprise users
        if (canAccessPremium) return true;
        
        // Enterprise features for enterprise users only
        if (canAccessEnterprise) return true;
        
        // Basic users can only see basic jobs
        return job.type === 'job' && !job.description.includes('premium');
      });
    }

    res.status(200).json({
      success: true,
      data: {
        jobs: filteredJobs.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          salary: job.salary,
          stipend: job.stipend,
          applicationDeadline: job.applicationDeadline,
          eligibility: job.eligibility,
          postedBy: job.postedBy,
          createdAt: job.createdAt,
          isActive: job.isActive
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredJobs.length,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all jobs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
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
 * Get a specific job by ID
 */
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    const job = await Job.findById(jobId)
      .populate('postedBy', 'name email')
      .populate('applications', 'status appliedAt');

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

    // Check if user can access this job based on subscription
    if (userId) {
      const canAccessPremium = await canAccessPremiumFeatures(userId);
      const canAccessEnterprise = await canAccessEnterpriseFeatures(userId);

      // Basic users can't access premium/enterprise jobs
      if (!canAccessPremium && job.description.includes('premium')) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Premium subscription required to access this job'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!canAccessEnterprise && job.description.includes('enterprise')) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Enterprise subscription required to access this job'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          description: job.description,
          type: job.type,
          location: job.location,
          salary: job.salary,
          stipend: job.stipend,
          applicationDeadline: job.applicationDeadline,
          eligibility: job.eligibility,
          postedBy: job.postedBy,
          createdAt: job.createdAt,
          isActive: job.isActive,
          applications: job.applications
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job by ID failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: req.params.jobId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update a job posting
 */
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.params;
    const updateData = req.body;

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

    // Find job and check ownership
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
          message: 'You can only update jobs you posted'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info('Job updated successfully', {
      adminId,
      jobId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: {
        job: {
          id: updatedJob?._id,
          title: updatedJob?.title,
          company: updatedJob?.company,
          type: updatedJob?.type,
          location: updatedJob?.location,
          isActive: updatedJob?.isActive,
          updatedAt: updatedJob?.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: req.params.jobId,
      adminId: req.user?.id,
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
 * Delete a job posting
 */
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.params;

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

    // Find job and check ownership
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
          message: 'You can only delete jobs you posted'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Soft delete (set isActive to false)
    await Job.findByIdAndUpdate(jobId, { isActive: false });

    logger.info('Job deleted successfully', {
      adminId,
      jobId,
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
      jobId: req.params.jobId,
      adminId: req.user?.id,
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
 * Toggle job status (active/inactive)
 */
export const toggleJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { jobId } = req.params;

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

    // Find job and check ownership
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
          message: 'You can only modify jobs you posted'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Toggle status
    const newStatus = !job.isActive;
    await Job.findByIdAndUpdate(jobId, { isActive: newStatus });

    logger.info('Job status toggled', {
      adminId,
      jobId,
      newStatus,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Job ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        jobId,
        isActive: newStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Toggle job status failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: req.params.jobId,
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to toggle job status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get job statistics (admin only)
 */
export const getJobStats = async (req: Request, res: Response): Promise<void> => {
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

    // Get job statistics
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const inactiveJobs = await Job.countDocuments({ isActive: false });
    const internshipJobs = await Job.countDocuments({ type: 'internship', isActive: true });
    const regularJobs = await Job.countDocuments({ type: 'job', isActive: true });

    // Get location distribution
    const locationStats = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly job posting trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
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

    // Get qualification distribution
    const qualificationStats = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$eligibility.qualifications' },
      {
        $group: {
          _id: '$eligibility.qualifications',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalJobs,
          activeJobs,
          inactiveJobs,
          internshipJobs,
          regularJobs
        },
        locationDistribution: locationStats,
        monthlyTrends,
        qualificationDistribution: qualificationStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job stats failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Search jobs with advanced filters
 */
export const searchJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      query,
      type,
      location,
      qualifications,
      streams,
      passoutYears,
      minCGPA,
      maxCGPA,
      salary,
      stipend,
      remote,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery: any = { isActive: true };

    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Type filter
    if (type) searchQuery.type = type;

    // Location filter
    if (location) {
      if (location === 'remote') {
        searchQuery.location = 'remote';
      } else if (location === 'onsite') {
        searchQuery.location = 'onsite';
      } else if (location === 'hybrid') {
        searchQuery.location = 'hybrid';
      }
    }

    // Qualification filter
    if (qualifications) {
      const quals = Array.isArray(qualifications) ? qualifications : [qualifications];
      searchQuery['eligibility.qualifications'] = { $in: quals };
    }

    // Stream filter
    if (streams) {
      const streamList = Array.isArray(streams) ? streams : [streams];
      searchQuery['eligibility.streams'] = { $in: streamList };
    }

    // Passout year filter
    if (passoutYears) {
      const years = Array.isArray(passoutYears) ? passoutYears : [passoutYears];
      searchQuery['eligibility.passoutYears'] = { $in: years.map(y => parseInt(y as string)) };
    }

    // CGPA filter
    if (minCGPA || maxCGPA) {
      searchQuery['eligibility.minCGPA'] = {};
      if (minCGPA) searchQuery['eligibility.minCGPA'].$gte = parseFloat(minCGPA as string);
      if (maxCGPA) searchQuery['eligibility.minCGPA'].$lte = parseFloat(maxCGPA as string);
    }

    // Salary filter
    if (salary) {
      searchQuery.salary = { $exists: true, $ne: null };
    }

    // Stipend filter
    if (stipend) {
      searchQuery.stipend = { $exists: true, $ne: null };
    }

    // Remote work filter
    if (remote === 'true') {
      searchQuery.location = 'remote';
    }

    // Execute search
    const jobs = await Job.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('postedBy', 'name email');

    const total = await Job.countDocuments(searchQuery);

    // Filter based on user subscription
    const userId = req.user?.id;
    let filteredJobs = jobs;

    if (userId) {
      const canAccessPremium = await canAccessPremiumFeatures(userId);
      const canAccessEnterprise = await canAccessEnterpriseFeatures(userId);

      filteredJobs = jobs.filter(job => {
        if (job.type === 'internship') return true;
        if (canAccessPremium) return true;
        if (canAccessEnterprise) return true;
        return !job.description.includes('premium') && !job.description.includes('enterprise');
      });
    }

    res.status(200).json({
      success: true,
      data: {
        jobs: filteredJobs.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          salary: job.salary,
          stipend: job.stipend,
          applicationDeadline: job.applicationDeadline,
          eligibility: job.eligibility,
          postedBy: job.postedBy,
          createdAt: job.createdAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredJobs.length,
          pages: Math.ceil(total / limitNum)
        },
        filters: {
          query,
          type,
          location,
          qualifications,
          streams,
          passoutYears,
          minCGPA,
          maxCGPA,
          salary: !!salary,
          stipend: !!stipend,
          remote: remote === 'true'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Search jobs failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to search jobs'
      },
      timestamp: new Date().toISOString()
    });
  }
};
