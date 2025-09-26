"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    // Enhanced error logging with structured data
    logger_1.logger.error('Application Error', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
    });
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Invalid resource ID format';
        error = { message, statusCode: 400, isOperational: true };
    }
    // Mongoose duplicate key
    if (err.name === 'MongoError' && err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const message = `Duplicate ${field} value entered`;
        error = { message, statusCode: 409, isOperational: true };
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = { message, statusCode: 400, isOperational: true };
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid authentication token';
        error = { message, statusCode: 401, isOperational: true };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Authentication token has expired';
        error = { message, statusCode: 401, isOperational: true };
    }
    // Syntax errors (malformed JSON)
    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        const message = 'Invalid JSON format in request body';
        error = { message, statusCode: 400, isOperational: true };
    }
    // Payload too large
    if (err.name === 'PayloadTooLargeError') {
        const message = 'Request payload is too large';
        error = { message, statusCode: 413, isOperational: true };
    }
    // Rate limiting
    if (err.name === 'TooManyRequestsError') {
        const message = 'Too many requests, please try again later';
        error = { message, statusCode: 429, isOperational: true };
    }
    // CORS errors
    if (err.name === 'CorsError') {
        const message = 'Cross-origin request blocked';
        error = { message, statusCode: 403, isOperational: true };
    }
    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    // Don't expose internal errors in production
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(isDevelopment && {
                stack: err.stack,
                name: err.name,
                code: err.code
            })
        },
        timestamp: new Date().toISOString(),
        ...(statusCode === 429 && { retryAfter: 60 }) // Add retry-after for rate limiting
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map