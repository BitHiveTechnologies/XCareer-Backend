"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const authController_1 = require("../../controllers/auth/authController");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
/**
 * @route   POST /api/v1/auth/register
 * @desc    User registration
 * @access  Public
 */
router.post('/register', (0, validation_1.validate)({
    body: joi_1.default.object({
        name: joi_1.default.string().min(2).max(50).required().messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required'
        }),
        email: joi_1.default.string().email().lowercase().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required'
        }),
        mobile: joi_1.default.string().pattern(/^[6-9]\d{9}$/).required().messages({
            'string.pattern.base': 'Please provide a valid Indian mobile number',
            'any.required': 'Mobile number is required'
        }),
        qualification: joi_1.default.string().required().messages({
            'any.required': 'Qualification is required'
        }),
        stream: joi_1.default.string().required().messages({
            'any.required': 'Stream is required'
        }),
        yearOfPassout: joi_1.default.number().integer().min(2000).max(new Date().getFullYear() + 5).required().messages({
            'number.base': 'Year of passout must be a number',
            'number.integer': 'Year of passout must be an integer',
            'number.min': 'Year of passout must be 2000 or later',
            'number.max': 'Year of passout cannot be more than 5 years in the future',
            'any.required': 'Year of passout is required'
        }),
        cgpaOrPercentage: joi_1.default.number().min(0).max(100).required().messages({
            'number.base': 'CGPA/Percentage must be a number',
            'number.min': 'CGPA/Percentage cannot be negative',
            'number.max': 'CGPA/Percentage cannot exceed 100',
            'any.required': 'CGPA/Percentage is required'
        })
    })
}), authController_1.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', (0, validation_1.validate)({
    body: joi_1.default.object({
        email: joi_1.default.string().email().lowercase().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string().required().messages({
            'any.required': 'Password is required'
        })
    })
}), authController_1.login);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', (0, validation_1.validate)({
    body: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'any.required': 'Refresh token is required'
        })
    })
}), authController_1.refreshToken);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', auth_1.authenticate, authController_1.logout);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth_1.authenticate, authController_1.getCurrentUser);
/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        currentPassword: joi_1.default.string().required().messages({
            'any.required': 'Current password is required'
        }),
        newPassword: joi_1.default.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
            'string.min': 'New password must be at least 8 characters long',
            'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'New password is required'
        })
    })
}), authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map