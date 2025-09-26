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
declare class PerformanceService {
    private metrics;
    private readonly SLOW_QUERY_THRESHOLD;
    private readonly MAX_METRICS;
    /**
     * Record a database operation
     */
    recordQuery(operation: string, collection: string, duration: number, query?: any, error?: string): void;
    /**
     * Get performance statistics
     */
    getStats(): PerformanceStats;
    /**
     * Clear metrics
     */
    clearMetrics(): void;
    /**
     * Get recent metrics
     */
    getRecentMetrics(limit?: number): QueryMetrics[];
}
export declare const performanceService: PerformanceService;
export {};
//# sourceMappingURL=performanceService.d.ts.map