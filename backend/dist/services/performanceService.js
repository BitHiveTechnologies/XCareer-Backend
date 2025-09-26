"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = void 0;
const logger_1 = require("../utils/logger");
class PerformanceService {
    constructor() {
        this.metrics = [];
        this.SLOW_QUERY_THRESHOLD = 1000; // 1 second
        this.MAX_METRICS = 1000; // Keep last 1000 metrics
    }
    /**
     * Record a database operation
     */
    recordQuery(operation, collection, duration, query, error) {
        const metric = {
            operation,
            collection,
            duration,
            timestamp: new Date(),
            query,
            error
        };
        this.metrics.push(metric);
        // Keep only the last MAX_METRICS entries
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }
        // Log slow queries
        if (duration > this.SLOW_QUERY_THRESHOLD) {
            logger_1.logger.warn('Slow query detected', {
                operation,
                collection,
                duration,
                query,
                threshold: this.SLOW_QUERY_THRESHOLD
            });
        }
        // Log errors
        if (error) {
            logger_1.logger.error('Database query error', {
                operation,
                collection,
                duration,
                error,
                query
            });
        }
    }
    /**
     * Get performance statistics
     */
    getStats() {
        if (this.metrics.length === 0) {
            return {
                totalQueries: 0,
                averageResponseTime: 0,
                slowQueries: 0,
                errorRate: 0,
                topSlowQueries: []
            };
        }
        const totalQueries = this.metrics.length;
        const averageResponseTime = this.metrics.reduce((sum, metric) => sum + metric.duration, 0) / totalQueries;
        const slowQueries = this.metrics.filter(metric => metric.duration > this.SLOW_QUERY_THRESHOLD).length;
        const errorRate = this.metrics.filter(metric => metric.error).length / totalQueries;
        // Calculate top slow queries
        const queryGroups = new Map();
        this.metrics.forEach(metric => {
            const key = `${metric.operation}:${metric.collection}`;
            const existing = queryGroups.get(key) || { totalDuration: 0, count: 0 };
            queryGroups.set(key, {
                totalDuration: existing.totalDuration + metric.duration,
                count: existing.count + 1
            });
        });
        const topSlowQueries = Array.from(queryGroups.entries())
            .map(([key, stats]) => {
            const [operation, collection] = key.split(':');
            return {
                operation,
                collection,
                averageDuration: stats.totalDuration / stats.count,
                count: stats.count
            };
        })
            .sort((a, b) => b.averageDuration - a.averageDuration)
            .slice(0, 10);
        return {
            totalQueries,
            averageResponseTime,
            slowQueries,
            errorRate,
            topSlowQueries
        };
    }
    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = [];
    }
    /**
     * Get recent metrics
     */
    getRecentMetrics(limit = 50) {
        return this.metrics.slice(-limit);
    }
}
exports.performanceService = new PerformanceService();
//# sourceMappingURL=performanceService.js.map