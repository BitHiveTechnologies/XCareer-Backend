import { config } from '../config/environment';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(config.LOG_LEVEL as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  // Request logging
  logRequest(req: any, res: any, responseTime: number): void {
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
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Error logging
  logError(error: Error, req?: any): void {
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
  logDatabase(operation: string, collection: string, duration: number, success: boolean): void {
    const logData = {
      operation,
      collection,
      duration: `${duration}ms`,
      success
    };

    if (success) {
      this.debug('Database Operation', logData);
    } else {
      this.error('Database Operation Failed', logData);
    }
  }

  // Payment logging
  logPayment(operation: string, amount: number, currency: string, success: boolean, meta?: any): void {
    const logData = {
      operation,
      amount,
      currency,
      success,
      ...meta
    };

    if (success) {
      this.info('Payment Operation', logData);
    } else {
      this.error('Payment Operation Failed', logData);
    }
  }

  // Email logging
  logEmail(operation: string, to: string, subject: string, success: boolean, meta?: any): void {
    const logData = {
      operation,
      to,
      subject,
      success,
      ...meta
    };

    if (success) {
      this.info('Email Operation', logData);
    } else {
      this.error('Email Operation Failed', logData);
    }
  }
}

export const logger = new Logger();
