"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMetrics = exports.analyzeQuery = exports.getIndexStats = exports.getRecentMetrics = exports.getPerformanceStats = void 0;
const performanceService_1 = require("../services/performanceService");
const logger_1 = require("../utils/logger");
/**
 * Get performance statistics
 */
const getPerformanceStats = async (req, res) => {
    try {
        const stats = performanceService_1.performanceService.getStats();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get performance stats', {
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
exports.getPerformanceStats = getPerformanceStats;
/**
 * Get recent query metrics
 */
const getRecentMetrics = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const limitNum = parseInt(limit) || 50;
        const metrics = performanceService_1.performanceService.getRecentMetrics(limitNum);
        res.status(200).json({
            success: true,
            data: {
                metrics,
                count: metrics.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get recent metrics', {
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
exports.getRecentMetrics = getRecentMetrics;
/**
 * Get database index statistics
 */
const getIndexStats = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get index stats', {
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
exports.getIndexStats = getIndexStats;
/**
 * Analyze query performance
 */
const analyzeQuery = async (req, res) => {
    try {
        const stats = performanceService_1.performanceService.getStats();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to analyze query', {
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
exports.analyzeQuery = analyzeQuery;
/**
 * Clear performance metrics
 */
const clearMetrics = async (req, res) => {
    try {
        performanceService_1.performanceService.clearMetrics();
        logger_1.logger.info('Performance metrics cleared', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.status(200).json({
            success: true,
            message: 'Performance metrics cleared successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to clear metrics', {
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
exports.clearMetrics = clearMetrics;
//# sourceMappingURL=performanceController.js.map