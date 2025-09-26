import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Security middleware for input sanitization and XSS protection
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Only sanitize if the request contains potentially dangerous content
    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Check for suspicious patterns before sanitizing
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /exec\s*\(/i,
      /eval\s*\(/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

    if (isSuspicious) {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      // Note: req.query and req.params are read-only in Express
      // We'll log the suspicious activity and let the application handle it
      logger.warn('Suspicious request detected and sanitized', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    next();
  } catch (error) {
    logger.error('Security middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request data'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  // Only sanitize if the string contains potentially dangerous content
  if (str.length > 1000 || /<script|javascript:|on\w+\s*=|union\s+select|drop\s+table/i.test(str)) {
    return str
      // Remove potential script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove potential HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove potential SQL injection patterns
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
      // Remove potential command injection patterns
      .replace(/[;&|`$(){}[\]\\]/g, '')
      // Trim whitespace
      .trim();
  }

  return str;
}

/**
 * Middleware to check for suspicious patterns
 */
export const suspiciousActivityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params
    });

    res.status(400).json({
      success: false,
      error: {
        message: 'Suspicious request detected'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};
