import { logger } from '../utils/logger';

interface QueryMetrics {
  operation: string;
  collection: string;
  duration: number;
  timestamp: Date;
  query?: any;
  error?: string;
}

interface PerformanceStats {
  totalQueries: number;
  averageResponseTime: number;
  slowQueries: number;
  errorRate: number;
  topSlowQueries: Array<{
    operation: string;
    collection: string;
    averageDuration: number;
    count: number;
  }>;
}

class PerformanceService {
  private metrics: QueryMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  /**
   * Record a database operation
   */
  recordQuery(operation: string, collection: string, duration: number, query?: any, error?: string): void {
    const metric: QueryMetrics = {
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
      logger.warn('Slow query detected', {
        operation,
        collection,
        duration,
        query,
        threshold: this.SLOW_QUERY_THRESHOLD
      });
    }

    // Log errors
    if (error) {
      logger.error('Database query error', {
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
  getStats(): PerformanceStats {
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
    const queryGroups = new Map<string, { totalDuration: number; count: number }>();
    
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
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 50): QueryMetrics[] {
    return this.metrics.slice(-limit);
  }
}

export const performanceService = new PerformanceService();
