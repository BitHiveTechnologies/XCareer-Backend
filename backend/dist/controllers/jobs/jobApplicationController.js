"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationStats = exports.withdrawApplication = exports.updateApplicationStatus = exports.getJobApplications = exports.getUserApplications = exports.applyForJob = void 0;
const JobApplication_1 = require("../../models/JobApplication");
const Job_1 = require("../../models/Job");
const logger_1 = require("../../utils/logger");
const subscriptionService_1 = require("../../utils/subscriptionService");
/**
 * Apply for a job
 */
const applyForJob = async (req, res) => {
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
        const job = await Job_1.Job.findById(jobId);
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
        const existingApplication = await JobApplication_1.JobApplication.findOne({
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
        const canAccessPremium = await (0, subscriptionService_1.canAccessPremiumFeatures)(userId);
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
        const application = new JobApplication_1.JobApplication({
            jobId,
            userId,
            status: 'applied',
            appliedAt: new Date(),
            resumeUrl,
            coverLetter
        });
        await application.save();
        logger_1.logger.info('Job application submitted', {
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
    }
    catch (error) {
        logger_1.logger.error('Apply for job failed', {
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
exports.applyForJob = applyForJob;
/**
 * Get user's job applications
 */
const getUserApplications = async (req, res) => {
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
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Build query
        const query = { userId };
        if (status) {
            query.status = status;
        }
        // Get applications with job details
        const applications = await JobApplication_1.JobApplication.find(query)
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('jobId', 'title company type location applicationDeadline')
            .populate('userId', 'name email');
        const total = await JobApplication_1.JobApplication.countDocuments(query);
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
    }
    catch (error) {
        logger_1.logger.error('Get user applications failed', {
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
exports.getUserApplications = getUserApplications;
/**
 * Get job applications for a specific job (admin only)
 */
const getJobApplications = async (req, res) => {
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
        const job = await Job_1.Job.findById(jobId);
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
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Build query
        const query = { jobId };
        if (status) {
            query.status = status;
        }
        // Get applications
        const applications = await JobApplication_1.JobApplication.find(query)
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email profile')
            .populate('jobId', 'title company type');
        const total = await JobApplication_1.JobApplication.countDocuments(query);
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
    }
    catch (error) {
        logger_1.logger.error('Get job applications failed', {
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
exports.getJobApplications = getJobApplications;
/**
 * Update application status (admin only)
 */
const updateApplicationStatus = async (req, res) => {
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
        const application = await JobApplication_1.JobApplication.findById(applicationId)
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
        if (application.jobId.postedBy.toString() !== adminId) {
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
        logger_1.logger.info('Application status updated', {
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
    }
    catch (error) {
        logger_1.logger.error('Update application status failed', {
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
exports.updateApplicationStatus = updateApplicationStatus;
/**
 * Withdraw application
 */
const withdrawApplication = async (req, res) => {
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
        const application = await JobApplication_1.JobApplication.findById(applicationId);
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
        logger_1.logger.info('Application withdrawn', {
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
    }
    catch (error) {
        logger_1.logger.error('Withdraw application failed', {
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
exports.withdrawApplication = withdrawApplication;
/**
 * Get application statistics (admin only)
 */
const getApplicationStats = async (req, res) => {
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
        const totalApplications = await JobApplication_1.JobApplication.countDocuments();
        const appliedApplications = await JobApplication_1.JobApplication.countDocuments({ status: 'applied' });
        const shortlistedApplications = await JobApplication_1.JobApplication.countDocuments({ status: 'shortlisted' });
        const rejectedApplications = await JobApplication_1.JobApplication.countDocuments({ status: 'rejected' });
        const withdrawnApplications = await JobApplication_1.JobApplication.countDocuments({ status: 'withdrawn' });
        // Get applications for jobs posted by this admin
        const adminJobs = await Job_1.Job.find({ postedBy: adminId }).select('_id');
        const adminJobIds = adminJobs.map(job => job._id);
        const adminTotalApplications = await JobApplication_1.JobApplication.countDocuments({
            jobId: { $in: adminJobIds }
        });
        const adminApplied = await JobApplication_1.JobApplication.countDocuments({
            jobId: { $in: adminJobIds },
            status: 'applied'
        });
        const adminShortlisted = await JobApplication_1.JobApplication.countDocuments({
            jobId: { $in: adminJobIds },
            status: 'shortlisted'
        });
        const adminRejected = await JobApplication_1.JobApplication.countDocuments({
            jobId: { $in: adminJobIds },
            status: 'rejected'
        });
        // Get monthly application trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyTrends = await JobApplication_1.JobApplication.aggregate([
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
    }
    catch (error) {
        logger_1.logger.error('Get application stats failed', {
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
exports.getApplicationStats = getApplicationStats;
//# sourceMappingURL=jobApplicationController.js.map