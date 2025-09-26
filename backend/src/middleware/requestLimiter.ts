import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Request size limiter middleware
 */
export const requestSizeLimiter = (maxSize: number = 1024 * 1024) => { // 1MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > maxSize) {
      logger.warn('Request size limit exceeded', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        contentLength,
        maxSize
      });

      res.status(413).json({
        success: false,
        error: {
          message: 'Request payload too large',
          maxSize: `${Math.round(maxSize / 1024)}KB`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => { // 30 seconds default
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          timeout: timeoutMs
        });

        res.status(408).json({
          success: false,
          error: {
            message: 'Request timeout'
          },
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalSend = res.send;
    res.send = function(data) {
      clearTimeout(timeout);
      return originalSend.call(this, data);
    };

    next();
  };
};
