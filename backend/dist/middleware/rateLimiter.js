"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("../config/environment");
// General API rate limiter
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.config.RATE_LIMIT_WINDOW_MS,
    max: environment_1.config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(environment_1.config.RATE_LIMIT_WINDOW_MS / 1000)
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(environment_1.config.RATE_LIMIT_WINDOW_MS / 1000)
            },
            timestamp: new Date().toISOString()
        });
    }
});
// Stricter rate limiter for authentication endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: 900
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many authentication attempts, please try again later.',
                retryAfter: 900
            },
            timestamp: new Date().toISOString()
        });
    }
});
// Rate limiter for payment endpoints
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        success: false,
        error: {
            message: 'Too many payment requests, please try again later.',
            retryAfter: 3600
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many payment requests, please try again later.',
                retryAfter: 3600
            },
            timestamp: new Date().toISOString()
        });
    }
});
//# sourceMappingURL=rateLimiter.js.map