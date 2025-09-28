import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false, // Changed to false for better security
      stripUnknown: true
    };

    const errors: string[] = [];
    const errorDetails: any[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, validationOptions);
      if (error) {
        const bodyErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        errors.push(...bodyErrors.map(e => e.message));
        errorDetails.push(...bodyErrors);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, validationOptions);
      if (error) {
        const queryErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        errors.push(...queryErrors.map(e => e.message));
        errorDetails.push(...queryErrors);
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, validationOptions);
      if (error) {
        const paramErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        errors.push(...paramErrors.map(e => e.message));
        errorDetails.push(...paramErrors);
      }
    }

    if (errors.length > 0) {
      // Log validation errors for monitoring
      logger.warn('Validation Error', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        errors: errorDetails,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Request validation failed',
          details: errorDetails,
          count: errors.length
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Alias for validate function
export const validateRequest = validate;

// Common validation schemas
export const commonSchemas = {
  // ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid ObjectId format'
  }),

  // Email validation
  email: Joi.string().email().lowercase().trim().messages({
    'string.email': 'Please provide a valid email address'
  }),

  // Password validation
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),

  // Phone number validation (Indian format)
  phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).messages({
    'string.pattern.base': 'Please provide a valid Indian phone number'
  }),

  // Date validation
  date: Joi.date().iso().messages({
    'date.base': 'Please provide a valid date',
    'date.format': 'Date must be in ISO format'
  }),

  // Pagination validation
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  },

  // Add missing Joi methods
  string: () => Joi.string(),
  object: (schema: any) => Joi.object(schema),
  // Add URI validation
  uri: () => Joi.string().uri(),
  // Add number validation
  number: () => Joi.number(),
  // Add array validation
  array: () => Joi.array(),
  // Add boolean validation
  boolean: () => Joi.boolean()
};
