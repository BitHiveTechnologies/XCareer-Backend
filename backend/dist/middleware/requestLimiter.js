"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = exports.requestSizeLimiter = void 0;
const logger_1 = require("../utils/logger");
/**
 * Request size limiter middleware
 */
const requestSizeLimiter = (maxSize = 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0', 10);
        if (contentLength > maxSize) {
            logger_1.logger.warn('Request size limit exceeded', {
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
exports.requestSizeLimiter = requestSizeLimiter;
/**
 * Request timeout middleware
 */
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.warn('Request timeout', {
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
        res.send = function (data) {
            clearTimeout(timeout);
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.requestTimeout = requestTimeout;
//# sourceMappingURL=requestLimiter.js.map