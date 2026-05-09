"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const validation_2 = require("../middleware/validation");
const router = express_1.default.Router();
// Rate limiting for authentication endpoints
router.use(rateLimiter_1.authLimiter);
// Public routes (no authentication required)
router.post('/register', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        email: validation_2.commonSchemas.email.required(),
        password: validation_2.commonSchemas.password.required(),
        name: validation_2.commonSchemas.string().min(2).max(100).required(),
        mobile: validation_2.commonSchemas.phoneNumber.required()
    })
}), authController_1.register);
router.post('/login', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        email: validation_2.commonSchemas.email.required(),
        password: validation_2.commonSchemas.string().min(8).required()
    })
}), authController_1.login);
router.post('/admin/login', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        email: validation_2.commonSchemas.email.required(),
        password: validation_2.commonSchemas.string().min(8).required()
    })
}), authController_1.adminLogin);
router.post('/refresh-token', (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        refreshToken: validation_2.commonSchemas.string().required()
    })
}), authController_1.refreshToken);
// Protected routes (authentication required)
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/change-password', auth_1.authenticate, (0, validation_1.validate)({
    body: validation_2.commonSchemas.object({
        currentPassword: validation_2.commonSchemas.string().min(8).required(),
        newPassword: validation_2.commonSchemas.password.required()
    })
}), authController_1.changePassword);
// Admin-only routes
router.get('/admin/profile', auth_1.authenticate, auth_1.requireAdmin, authController_1.getProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map