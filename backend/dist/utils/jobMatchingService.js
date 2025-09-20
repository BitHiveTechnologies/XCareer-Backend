"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingJobsAdvanced = exports.getMatchingStatistics = exports.getJobRecommendations = exports.findMatchingUsersForJob = exports.findMatchingJobsForUser = exports.calculateMatchScore = void 0;
const Job_1 = require("../models/Job");
const UserProfile_1 = require("../models/UserProfile");
const logger_1 = require("./logger");
/**
 * Calculate match score between user and job
 */
const calculateMatchScore = (userProfile, jobEligibility) => {
    let score = 0;
    const reasons = [];
    // Qualification match (40% weight)
    const qualificationMatch = userProfile.qualification === jobEligibility.qualifications[0] ||
        jobEligibility.qualifications.includes(userProfile.qualification);
    if (qualificationMatch) {
        score += 40;
        reasons.push('Qualification matches job requirements');
    }
    else {
        reasons.push('Qualification does not match job requirements');
    }
    // Stream match (30% weight)
    const streamMatch = userProfile.stream === jobEligibility.streams[0] ||
        jobEligibility.streams.includes(userProfile.stream);
    if (streamMatch) {
        score += 30;
        reasons.push('Academic stream matches job requirements');
    }
    else {
        reasons.push('Academic stream does not match job requirements');
    }
    // Passout year match (20% weight)
    const yearMatch = jobEligibility.passoutYears.includes(userProfile.yearOfPassout);
    if (yearMatch) {
        score += 20;
        reasons.push('Graduation year matches job requirements');
    }
    else {
        const yearDiff = Math.abs(userProfile.yearOfPassout - Math.min(...jobEligibility.passoutYears));
        if (yearDiff <= 1) {
            score += 10;
            reasons.push('Graduation year is within acceptable range');
        }
        else {
            reasons.push('Graduation year does not match job requirements');
        }
    }
    // CGPA match (10% weight)
    if (jobEligibility.minCGPA && userProfile.cgpaOrPercentage) {
        const userCGPA = userProfile.cgpaOrPercentage;
        if (userCGPA >= jobEligibility.minCGPA) {
            score += 10;
            reasons.push(`CGPA (${userCGPA}) meets minimum requirement (${jobEligibility.minCGPA})`);
        }
        else {
            reasons.push(`CGPA (${userCGPA}) below minimum requirement (${jobEligibility.minCGPA})`);
        }
    }
    else {
        score += 10;
        reasons.push('No CGPA requirement specified');
    }
    // Bonus points for exact matches
    if (qualificationMatch && streamMatch && yearMatch) {
        score += 5;
        reasons.push('Perfect match bonus');
    }
    return { score, reasons };
};
exports.calculateMatchScore = calculateMatchScore;
/**
 * Find jobs that match a specific user
 */
const findMatchingJobsForUser = async (userId, limit = 20) => {
    try {
        const userProfile = await UserProfile_1.UserProfile.findOne({ userId }).populate('userId', 'name email');
        if (!userProfile) {
            throw new Error('User profile not found');
        }
        const jobs = await Job_1.Job.find({ isActive: true }).sort({ createdAt: -1 });
        const jobMatches = [];
        for (const job of jobs) {
            const { score, reasons } = (0, exports.calculateMatchScore)(userProfile, job.eligibility);
            if (score > 0) {
                jobMatches.push({
                    jobId: job._id.toString(),
                    title: job.title,
                    company: job.company,
                    type: job.type,
                    location: job.location,
                    matchScore: score,
                    matchReasons: reasons,
                    eligibility: job.eligibility,
                    userQualifications: {
                        qualification: userProfile.qualification,
                        stream: userProfile.stream,
                        yearOfPassout: userProfile.yearOfPassout,
                        cgpa: userProfile.cgpaOrPercentage
                    }
                });
            }
        }
        return jobMatches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }
    catch (error) {
        logger_1.logger.error('Find matching jobs for user failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        throw error;
    }
};
exports.findMatchingJobsForUser = findMatchingJobsForUser;
/**
 * Find users that match a specific job
 */
const findMatchingUsersForJob = async (jobId, limit = 50) => {
    try {
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }
        const query = {};
        if (job.eligibility.qualifications.length > 0) {
            query.qualification = { $in: job.eligibility.qualifications };
        }
        if (job.eligibility.streams.length > 0) {
            query.stream = { $in: job.eligibility.streams };
        }
        if (job.eligibility.passoutYears.length > 0) {
            query.yearOfPassout = { $in: job.eligibility.passoutYears };
        }
        const userProfiles = await UserProfile_1.UserProfile.find(query)
            .populate('userId', 'name email')
            .limit(limit * 2);
        const userMatches = [];
        for (const profile of userProfiles) {
            if (job.eligibility.minCGPA && profile.cgpaOrPercentage < job.eligibility.minCGPA) {
                continue;
            }
            const { score, reasons } = (0, exports.calculateMatchScore)(profile, job.eligibility);
            if (score > 0) {
                userMatches.push({
                    userId: profile.userId._id.toString(),
                    name: profile.userId.name,
                    email: profile.userId.email,
                    matchScore: score,
                    matchReasons: reasons,
                    profile: {
                        qualification: profile.qualification,
                        stream: profile.stream,
                        yearOfPassout: profile.yearOfPassout,
                        cgpa: profile.cgpaOrPercentage
                    }
                });
            }
        }
        return userMatches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }
    catch (error) {
        logger_1.logger.error('Find matching users for job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jobId
        });
        throw error;
    }
};
exports.findMatchingUsersForJob = findMatchingUsersForJob;
/**
 * Get job recommendations for a user
 */
const getJobRecommendations = async (userId, preferences = {}) => {
    try {
        const { preferredJobTypes = ['job', 'internship'], preferredLocations = ['remote', 'onsite', 'hybrid'], minMatchScore = 40, maxResults = 15 } = preferences;
        const userProfile = await UserProfile_1.UserProfile.findOne({ userId });
        if (!userProfile) {
            // Return empty recommendations if no user profile exists
            return [];
        }
        const jobs = await Job_1.Job.find({
            isActive: true,
            type: { $in: preferredJobTypes },
            location: { $in: preferredLocations },
            applicationDeadline: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        const jobMatches = [];
        for (const job of jobs) {
            const { score, reasons } = (0, exports.calculateMatchScore)(userProfile, job.eligibility);
            if (score >= minMatchScore) {
                jobMatches.push({
                    jobId: job._id.toString(),
                    title: job.title,
                    company: job.company,
                    type: job.type,
                    location: job.location,
                    matchScore: score,
                    matchReasons: reasons,
                    eligibility: job.eligibility,
                    userQualifications: {
                        qualification: userProfile.qualification,
                        stream: userProfile.stream,
                        yearOfPassout: userProfile.yearOfPassout,
                        cgpa: userProfile.cgpaOrPercentage
                    }
                });
            }
        }
        return jobMatches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, maxResults);
    }
    catch (error) {
        logger_1.logger.error('Get job recommendations failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        throw error;
    }
};
exports.getJobRecommendations = getJobRecommendations;
/**
 * Generate detailed match reasons for a user-job combination
 */
const generateMatchReasons = (userProfile, job) => {
    const reasons = [];
    // Qualification match
    const qualificationMatch = userProfile.qualifications?.some((qual) => job.eligibility.qualifications.includes(qual)) || userProfile.qualification === job.eligibility.qualifications[0];
    if (qualificationMatch) {
        reasons.push(`Qualification match: ${userProfile.qualifications?.join(', ') || userProfile.qualification}`);
    }
    // Stream match
    if (job.eligibility.streams.includes(userProfile.stream)) {
        reasons.push(`Stream match: ${userProfile.stream}`);
    }
    // Passout year match
    if (job.eligibility.passoutYears.includes(userProfile.yearOfPassout)) {
        reasons.push(`Recent graduate (${userProfile.yearOfPassout})`);
    }
    // Location preference
    if (job.location === 'remote') {
        reasons.push('Remote work available');
    }
    return reasons;
};
/**
 * Get advanced matching statistics for analytics
 */
const getMatchingStatistics = async () => {
    try {
        const totalUsers = await UserProfile_1.UserProfile.countDocuments();
        const totalJobs = await Job_1.Job.countDocuments({ isActive: true });
        // Get qualification distribution
        const qualificationStats = await UserProfile_1.UserProfile.aggregate([
            { $unwind: '$qualifications' },
            { $group: { _id: '$qualifications', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        // Get stream distribution
        const streamStats = await UserProfile_1.UserProfile.aggregate([
            { $group: { _id: '$stream', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        // Calculate average match scores (placeholder for now)
        const averageMatchScore = 75; // This would be calculated from actual matches
        return {
            totalUsers,
            totalJobs,
            averageMatchScore,
            topQualifications: qualificationStats.map(stat => stat._id),
            topStreams: streamStats.map(stat => stat._id),
            matchingEfficiency: 'high',
            lastUpdated: new Date()
        };
    }
    catch (error) {
        logger_1.logger.error('Get matching statistics failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
};
exports.getMatchingStatistics = getMatchingStatistics;
/**
 * Find jobs with advanced filtering and scoring
 */
const findMatchingJobsAdvanced = async (userId, filters, options) => {
    try {
        const userProfile = await UserProfile_1.UserProfile.findOne({ userId });
        if (!userProfile) {
            throw new Error('User profile not found');
        }
        // Build query based on filters
        const query = { isActive: true, applicationDeadline: { $gt: new Date() } };
        if (filters.jobTypes?.length) {
            query.type = { $in: filters.jobTypes };
        }
        if (filters.locations?.length) {
            query.location = { $in: filters.locations };
        }
        if (filters.qualifications?.length) {
            query['eligibility.qualifications'] = { $in: filters.qualifications };
        }
        if (filters.streams?.length) {
            query['eligibility.streams'] = { $in: filters.streams };
        }
        // Find matching jobs
        const jobs = await Job_1.Job.find(query)
            .populate('postedBy', 'name company')
            .limit(options.limit)
            .skip(options.offset);
        // Calculate advanced scores and create matches
        const advancedMatches = jobs.map(job => {
            const baseScore = (0, exports.calculateMatchScore)(userProfile, job.eligibility).score;
            const advancedScore = calculateAdvancedScore(userProfile, job, filters);
            const matchReasons = generateDetailedMatchReasons(userProfile, job);
            return {
                jobId: job._id.toString(),
                title: job.title,
                company: job.postedBy?.name || 'Unknown Company',
                type: job.type,
                location: job.location,
                salary: job.salary,
                stipend: job.stipend,
                baseMatchScore: baseScore,
                advancedMatchScore: advancedScore,
                matchReasons,
                applicationDeadline: job.applicationDeadline,
                postedDate: job.createdAt
            };
        });
        // Sort based on options
        switch (options.sortBy) {
            case 'relevance':
                advancedMatches.sort((a, b) => b.advancedMatchScore - a.advancedMatchScore);
                break;
            case 'date':
                advancedMatches.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
                break;
            case 'salary':
                advancedMatches.sort((a, b) => (parseInt(b.salary || '0') - parseInt(a.salary || '0')));
                break;
        }
        return advancedMatches;
    }
    catch (error) {
        logger_1.logger.error('Advanced job matching failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        throw error;
    }
};
exports.findMatchingJobsAdvanced = findMatchingJobsAdvanced;
/**
 * Calculate advanced match score with additional factors
 */
const calculateAdvancedScore = (userProfile, job, filters) => {
    let score = (0, exports.calculateMatchScore)(userProfile, job.eligibility).score;
    // Bonus for exact qualification match
    if (filters.qualifications?.includes(userProfile.qualifications?.[0] || userProfile.qualification)) {
        score += 10;
    }
    // Bonus for preferred location
    if (filters.locations?.includes(job.location)) {
        score += 5;
    }
    // Bonus for recent posting (within 7 days)
    const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePosted <= 7) {
        score += 3;
    }
    return Math.min(100, score);
};
/**
 * Generate detailed match reasons with explanations
 */
const generateDetailedMatchReasons = (userProfile, job) => {
    const reasons = [];
    // Qualification analysis
    const qualificationMatch = userProfile.qualifications?.some((qual) => job.eligibility.qualifications.includes(qual)) || userProfile.qualification === job.eligibility.qualifications[0];
    if (qualificationMatch) {
        reasons.push({
            type: 'qualification',
            message: `Your ${userProfile.qualifications?.join(', ') || userProfile.qualification} qualification(s) match the job requirements`,
            score: 25
        });
    }
    // Stream analysis
    if (job.eligibility.streams.includes(userProfile.stream)) {
        reasons.push({
            type: 'stream',
            message: `Your ${userProfile.stream} stream is exactly what they're looking for`,
            score: 20
        });
    }
    // Experience level analysis
    const currentYear = new Date().getFullYear();
    const yearsSinceGraduation = currentYear - userProfile.yearOfPassout;
    if (yearsSinceGraduation <= 2) {
        reasons.push({
            type: 'experience',
            message: `Recent graduate (${yearsSinceGraduation} year${yearsSinceGraduation === 1 ? '' : 's'} experience)`,
            score: 15
        });
    }
    // Location preference
    if (job.location === 'remote') {
        reasons.push({
            type: 'location',
            message: 'Remote work available - flexible location',
            score: 10
        });
    }
    return reasons;
};
//# sourceMappingURL=jobMatchingService.js.map