import { Request, Response } from 'express';
import { performanceService } from '../services/performanceService';
import { logger } from '../utils/logger';

/**
 * Get performance statistics
 */
export const getPerformanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = performanceService.getStats();

    res.status(200).json({
      success: true,
      data: {
        totalQueries: stats.totalQueries,
        averageResponseTime: stats.averageResponseTime,
        slowQueries: stats.slowQueries,
        errorRate: stats.errorRate,
        topSlowQueries: stats.topSlowQueries
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get performance stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get performance statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get recent query metrics
 */
export const getRecentMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit as string) || 50;
    const metrics = performanceService.getRecentMetrics(limitNum);

    res.status(200).json({
      success: true,
      data: {
        metrics,
        count: metrics.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get recent metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get recent metrics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get database index statistics
 */
export const getIndexStats = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        message: 'Database indexes have been created during application startup',
        indexes: [
          'User: email (unique), clerkUserId (unique), role, subscriptionPlan, subscriptionStatus, createdAt',
          'Job: title+company, location, type, qualifications, streams, passoutYears, isActive+createdAt, postedBy, text search',
          'JobApplication: userId+jobId (unique), userId+status, jobId+status, appliedAt',
          'Subscription: userId (unique), status, plan, startDate, endDate, paymentId, orderId'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get index stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get index statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Analyze query performance
 */
export const analyzeQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = performanceService.getStats();

    res.status(200).json({
      success: true,
      data: {
        analysis: {
          totalQueries: stats.totalQueries,
          averageResponseTime: stats.averageResponseTime,
          slowQueries: stats.slowQueries,
          errorRate: stats.errorRate
        },
        recommendations: [
          'Monitor slow queries and consider adding indexes',
          'Review error rates and investigate failed queries',
          'Consider query optimization for frequently executed queries'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to analyze query', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to analyze query performance'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Clear performance metrics
 */
export const clearMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    performanceService.clearMetrics();

    logger.info('Performance metrics cleared', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Performance metrics cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to clear metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to clear performance metrics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

