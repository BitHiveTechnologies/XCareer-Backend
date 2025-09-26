import { NextFunction, Request, Response } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: string;
    keyValue?: any;
    errors?: any;
}
export declare const errorHandler: (err: AppError, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map