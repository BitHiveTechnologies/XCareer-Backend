"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdvancedJobMatching = exports.getMatchingStats = exports.getJobRecommendationsForUser = exports.getMatchingUsers = exports.getMatchingJobs = void 0;
const logger_1 = require("../../utils/logger");
const jobMatchingService_1 = require("../../utils/jobMatchingService");
/**
 * Get matching jobs for a user
 */
const getMatchingJobs = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 20 } = req.query;
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
        const limitNum = parseInt(limit) || 20;
        const matchingJobs = await (0, jobMatchingService_1.findMatchingJobsForUser)(userId, limitNum);
        logger_1.logger.info('Matching jobs retrieved', {
            userId,
            jobCount: matchingJobs.length,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                matchingJobs,
                total: matchingJobs.length,
                userId
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get matching jobs failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get matching jobs'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getMatchingJobs = getMatchingJobs;
/**
 * Get matching users for a job (admin only)
 */
const getMatchingUsers = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { jobId } = req.params;
        const { limit = 50 } = req.query;
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
        const limitNum = parseInt(limit) || 50;
        const matchingUsers = await (0, jobMatchingService_1.findMatchingUsersForJob)(jobId, limitNum);
        logger_1.logger.info('Matching users retrieved', {
            adminId,
            jobId,
            userCount: matchingUsers.length,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                matchingUsers,
                total: matchingUsers.length,
                jobId
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get matching users failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            jobId: req.params.jobId,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get matching users'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getMatchingUsers = getMatchingUsers;
/**
 * Get personalized job recommendations for a user
 */
const getJobRecommendationsForUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { preferredJobTypes, preferredLocations, minMatchScore = 40, maxResults = 15 } = req.body;
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
        const recommendations = await (0, jobMatchingService_1.getJobRecommendations)(userId, {
            preferredJobTypes: preferredJobTypes || ['job', 'internship'],
            preferredLocations: preferredLocations || ['remote', 'onsite', 'hybrid'],
            minMatchScore: parseInt(minMatchScore) || 40,
            maxResults: parseInt(maxResults) || 15
        });
        logger_1.logger.info('Job recommendations retrieved', {
            userId,
            recommendationCount: recommendations.length,
            preferences: { preferredJobTypes, preferredLocations, minMatchScore, maxResults },
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                recommendations,
                total: recommendations.length,
                preferences: {
                    preferredJobTypes: preferredJobTypes || ['job', 'internship'],
                    preferredLocations: preferredLocations || ['remote', 'onsite', 'hybrid'],
                    minMatchScore: parseInt(minMatchScore) || 40,
                    maxResults: parseInt(maxResults) || 15
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get job recommendations failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get job recommendations'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getJobRecommendationsForUser = getJobRecommendationsForUser;
/**
 * Get job matching statistics (admin only)
 */
const getMatchingStats = async (req, res) => {
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
        // Get real matching statistics
        const stats = await (0, jobMatchingService_1.getMatchingStatistics)();
        logger_1.logger.info('Matching statistics retrieved', {
            adminId,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                statistics: stats,
                message: 'Matching statistics retrieved successfully'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get matching statistics failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get matching statistics'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getMatchingStats = getMatchingStats;
/**
 * Get advanced job matching with filters and sorting (admin only)
 */
const getAdvancedJobMatching = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { jobTypes, locations, qualifications, streams, minSalary, maxSalary, experienceLevel, limit = 20, offset = 0, sortBy = 'relevance' } = req.body;
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
        const filters = {
            jobTypes,
            locations,
            qualifications,
            streams,
            minSalary,
            maxSalary,
            experienceLevel
        };
        const options = {
            limit: parseInt(limit) || 20,
            offset: parseInt(offset) || 0,
            sortBy: sortBy
        };
        const advancedMatches = await (0, jobMatchingService_1.findMatchingJobsAdvanced)(adminId, filters, options);
        logger_1.logger.info('Advanced job matching retrieved', {
            adminId,
            matchCount: advancedMatches.length,
            filters,
            options,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                advancedMatches,
                total: advancedMatches.length,
                filters,
                options
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Advanced job matching failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            adminId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get advanced job matching'
            },
            timestamp: new Date().toISOString()
        });
    }
};
exports.getAdvancedJobMatching = getAdvancedJobMatching;
//# sourceMappingURL=jobMatchingController.js.map