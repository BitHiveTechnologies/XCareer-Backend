import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import {
  findMatchingJobsForUser,
  findMatchingUsersForJob,
  getJobRecommendations,
  getMatchingStatistics
} from '../../utils/jobMatchingService';

/**
 * Get matching jobs for a user
 */
export const getMatchingJobs = async (req: Request, res: Response): Promise<void> => {
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

    const limitNum = parseInt(limit as string) || 20;
    const matchingJobs = await findMatchingJobsForUser(userId, limitNum);

    logger.info('Matching jobs retrieved', {
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
  } catch (error) {
    logger.error('Get matching jobs failed', {
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

/**
 * Get matching users for a job (admin only)
 */
export const getMatchingUsers = async (req: Request, res: Response): Promise<void> => {
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

    const limitNum = parseInt(limit as string) || 50;
    const matchingUsers = await findMatchingUsersForJob(jobId, limitNum);

    logger.info('Matching users retrieved', {
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
  } catch (error) {
    logger.error('Get matching users failed', {
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

/**
 * Get personalized job recommendations for a user
 */
export const getJobRecommendationsForUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      preferredJobTypes,
      preferredLocations,
      minMatchScore = 40,
      maxResults = 15
    } = req.method === 'GET' ? req.query : req.body;

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

    // Find user by email (JWT provides email)
    const user = await User.findOne({ email: req.user?.email });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const recommendations = await getJobRecommendations(user._id.toString(), {
      minScore: parseInt(minMatchScore as string) || 50,
      limit: parseInt(maxResults as string) || 15
    });

    logger.info('Job recommendations retrieved', {
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
          minMatchScore: parseInt(minMatchScore as string) || 40,
          maxResults: parseInt(maxResults as string) || 15
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get job recommendations failed', {
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

/**
 * Get job matching statistics (admin only)
 */
export const getMatchingStats = async (req: Request, res: Response): Promise<void> => {
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
    const stats = await getMatchingStatistics();

    logger.info('Matching statistics retrieved', {
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
  } catch (error) {
    logger.error('Get matching statistics failed', {
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

/**
 * Get advanced job matching with filters and sorting (admin only)
 */
export const getAdvancedJobMatching = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
      return;
    }
    const { minScore = 50, limit = 20 } = req.query;
    const matches = await findMatchingJobsForUser(userId, parseInt(limit as string) || 20, parseInt(minScore as string) || 50);
    res.status(200).json({ success: true, data: { matches, total: matches.length }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to get advanced job matching' }, timestamp: new Date().toISOString() });
  }
};
