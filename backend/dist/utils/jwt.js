"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyRefreshToken = exports.generateRefreshToken = exports.verifyToken = exports.generateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const logger_1 = require("./logger");
const environment_1 = require("../config/environment");
/**
 * Generate JWT access token
 */
const generateToken = (payload) => {
    try {
        const token = jwt.sign(payload, environment_1.config.JWT_SECRET, {
            expiresIn: environment_1.config.JWT_EXPIRE,
            issuer: 'notifyx-backend',
            audience: 'notifyx-users'
        });
        logger_1.logger.info('JWT access token generated successfully', {
            userId: payload.userId,
            role: payload.role
        });
        return token;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate JWT token', {
            error: error instanceof Error ? error.message : 'Unknown error',
            payload
        });
        throw new Error('Failed to generate authentication token');
    }
};
exports.generateToken = generateToken;
/**
 * Verify JWT access token
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, environment_1.config.JWT_SECRET, {
            issuer: 'notifyx-backend',
            audience: 'notifyx-users'
        });
        logger_1.logger.info('JWT token verified successfully', {
            userId: decoded.userId,
            role: decoded.role
        });
        return decoded;
    }
    catch (error) {
        logger_1.logger.error('Failed to verify JWT token', {
            error: error instanceof Error ? error.message : 'Unknown error',
            token: token.substring(0, 20) + '...'
        });
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        else {
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
    try {
        const token = jwt.sign(payload, environment_1.config.JWT_SECRET, {
            expiresIn: environment_1.config.JWT_REFRESH_EXPIRE,
            issuer: 'notifyx-backend',
            audience: 'notifyx-users'
        });
        logger_1.logger.info('Refresh token generated successfully', {
            userId: payload.userId
        });
        return token;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate refresh token', {
            error: error instanceof Error ? error.message : 'Unknown error',
            payload
        });
        throw new Error('Failed to generate refresh token');
    }
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, environment_1.config.JWT_SECRET, {
            issuer: 'notifyx-backend',
            audience: 'notifyx-users'
        });
        logger_1.logger.info('Refresh token verified successfully', {
            userId: decoded.userId
        });
        return decoded;
    }
    catch (error) {
        logger_1.logger.error('Failed to verify refresh token', {
            error: error instanceof Error ? error.message : 'Unknown error',
            token: token.substring(0, 20) + '...'
        });
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        }
        else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        }
        else {
            throw new Error('Refresh token verification failed');
        }
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Decode JWT token without verification (for debugging)
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    }
    catch (error) {
        logger_1.logger.error('Failed to decode JWT token', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map