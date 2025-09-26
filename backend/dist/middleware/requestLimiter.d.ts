import { NextFunction, Request, Response } from 'express';
/**
 * Request size limiter middleware
 */
export declare const requestSizeLimiter: (maxSize?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request timeout middleware
 */
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requestLimiter.d.ts.map