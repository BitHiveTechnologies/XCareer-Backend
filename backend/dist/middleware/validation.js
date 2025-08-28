"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const validate = (schema) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        };
        const errors = [];
        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, validationOptions);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query, validationOptions);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate route parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params, validationOptions);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.validate = validate;
// Common validation schemas
exports.commonSchemas = {
    // ObjectId validation
    objectId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'Invalid ObjectId format'
    }),
    // Email validation
    email: joi_1.default.string().email().lowercase().trim().messages({
        'string.email': 'Please provide a valid email address'
    }),
    // Password validation
    password: joi_1.default.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
    // Phone number validation (Indian format)
    phoneNumber: joi_1.default.string().pattern(/^[6-9]\d{9}$/).messages({
        'string.pattern.base': 'Please provide a valid Indian phone number'
    }),
    // Date validation
    date: joi_1.default.date().iso().messages({
        'date.base': 'Please provide a valid date',
        'date.format': 'Date must be in ISO format'
    }),
    // Pagination validation
    pagination: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
        sortBy: joi_1.default.string().valid('createdAt', 'updatedAt', 'name', 'email').default('createdAt'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    },
    // Add missing Joi methods
    string: () => joi_1.default.string(),
    object: (schema) => joi_1.default.object(schema),
    // Add URI validation
    uri: () => joi_1.default.string().uri(),
    // Add number validation
    number: () => joi_1.default.number(),
    // Add array validation
    array: () => joi_1.default.array()
};
//# sourceMappingURL=validation.js.map