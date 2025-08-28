import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonSchemas: {
    objectId: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    phoneNumber: Joi.StringSchema<string>;
    date: Joi.DateSchema<Date>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
        sortBy: Joi.StringSchema<string>;
        sortOrder: Joi.StringSchema<string>;
    };
    string: () => Joi.StringSchema<string>;
    object: (schema: any) => Joi.ObjectSchema<any>;
    uri: () => Joi.StringSchema<string>;
    number: () => Joi.NumberSchema<number>;
    array: () => Joi.ArraySchema<any[]>;
};
//# sourceMappingURL=validation.d.ts.map