"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Admin_1 = require("../../models/Admin");
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../../config/environment");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login with email and password
 * @access  Public
 */
router.post('/login', (0, validation_1.validateRequest)({
    body: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(8).required()
    })
}), async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find admin by email
        const admin = await Admin_1.Admin.findOne({ email, isActive: true });
        if (!admin) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials or account inactive'
                },
                timestamp: new Date().toISOString()
            });
        }
        // Verify password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials'
                },
                timestamp: new Date().toISOString()
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: admin._id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        }, environment_1.config.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // Log successful login
        logger_1.logger.info('Admin login successful', {
            adminId: admin._id,
            email: admin.email,
            role: admin.role,
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            data: {
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    permissions: admin.permissions
                },
                token
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Admin login failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email: req.body.email,
            ip: req.ip
        });
        res.status(500).json({
            success: false,
            error: {
                message: 'Login failed. Please try again.'
            },
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=adminAuth.js.map