import { NextFunction, Request, Response } from 'express';
/**
 * Security middleware for input sanitization and XSS protection
 */
export declare const securityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check for suspicious patterns
 */
export declare const suspiciousActivityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.d.ts.map