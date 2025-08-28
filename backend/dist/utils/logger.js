"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
const environment_1 = require("../config/environment");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    getTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, meta) {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }
    shouldLog(level) {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentLevelIndex = levels.indexOf(environment_1.config.LOG_LEVEL);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    error(message, meta) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage(LogLevel.INFO, message, meta));
        }
    }
    debug(message, meta) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
    // Request logging
    logRequest(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous'
        };
        if (res.statusCode >= 400) {
            this.warn('HTTP Request', logData);
        }
        else {
            this.info('HTTP Request', logData);
        }
    }
    // Error logging
    logError(error, req) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            url: req?.originalUrl,
            method: req?.method,
            ip: req?.ip,
            userAgent: req?.get('User-Agent'),
            userId: req?.user?.id || 'anonymous'
        };
        this.error('Application Error', errorData);
    }
    // Database operation logging
    logDatabase(operation, collection, duration, success) {
        const logData = {
            operation,
            collection,
            duration: `${duration}ms`,
            success
        };
        if (success) {
            this.debug('Database Operation', logData);
        }
        else {
            this.error('Database Operation Failed', logData);
        }
    }
    // Payment logging
    logPayment(operation, amount, currency, success, meta) {
        const logData = {
            operation,
            amount,
            currency,
            success,
            ...meta
        };
        if (success) {
            this.info('Payment Operation', logData);
        }
        else {
            this.error('Payment Operation Failed', logData);
        }
    }
    // Email logging
    logEmail(operation, to, subject, success, meta) {
        const logData = {
            operation,
            to,
            subject,
            success,
            ...meta
        };
        if (success) {
            this.info('Email Operation', logData);
        }
        else {
            this.error('Email Operation Failed', logData);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map