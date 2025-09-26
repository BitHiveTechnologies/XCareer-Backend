import { Request, Response } from 'express';
/**
 * Get performance statistics
 */
export declare const getPerformanceStats: (req: Request, res: Response) => Promise<void>;
/**
 * Get recent query metrics
 */
export declare const getRecentMetrics: (req: Request, res: Response) => Promise<void>;
/**
 * Get database index statistics
 */
export declare const getIndexStats: (req: Request, res: Response) => Promise<void>;
/**
 * Analyze query performance
 */
export declare const analyzeQuery: (req: Request, res: Response) => Promise<void>;
/**
 * Clear performance metrics
 */
export declare const clearMetrics: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=performanceController.d.ts.map