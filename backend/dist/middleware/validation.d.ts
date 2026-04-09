import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonSchemas: {
    objectId: any;
    email: any;
    password: any;
    phoneNumber: any;
    date: any;
    pagination: {
        page: any;
        limit: any;
        sortBy: any;
        sortOrder: any;
    };
    string: () => any;
    object: (schema: any) => any;
    uri: () => any;
    number: () => any;
    array: () => any;
    boolean: () => any;
};
//# sourceMappingURL=validation.d.ts.map