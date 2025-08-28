export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
declare class Logger {
    private getTimestamp;
    private formatMessage;
    private shouldLog;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    logRequest(req: any, res: any, responseTime: number): void;
    logError(error: Error, req?: any): void;
    logDatabase(operation: string, collection: string, duration: number, success: boolean): void;
    logPayment(operation: string, amount: number, currency: string, success: boolean, meta?: any): void;
    logEmail(operation: string, to: string, subject: string, success: boolean, meta?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map