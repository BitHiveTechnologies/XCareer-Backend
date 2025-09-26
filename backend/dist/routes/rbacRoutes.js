"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const rbacController_1 = require("../controllers/rbacController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
/**
 * @route GET /api/v1/rbac/permissions
 * @desc Get current user's permissions and capabilities
 * @access Private
 */
router.get('/permissions', jwtAuth_1.authenticate, rbacController_1.getUserPermissions);
/**
 * @route POST /api/v1/rbac/check-permission
 * @desc Check if user has specific permission
 * @access Private
 */
router.post('/check-permission', jwtAuth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        resource: joi_1.default.string().required(),
        action: joi_1.default.string().required(),
        conditions: joi_1.default.object().optional()
    })
}), rbacController_1.checkPermission);
/**
 * @route GET /api/v1/rbac/roles
 * @desc Get all available roles and permissions
 * @access Private (Admin only)
 */
router.get('/roles', jwtAuth_1.authenticate, rbacMiddleware_1.requireAdminPermission, rbacController_1.getRolesAndPermissions);
/**
 * @route GET /api/v1/rbac/limits
 * @desc Get user's subscription limits
 * @access Private
 */
router.get('/limits', jwtAuth_1.authenticate, rbacController_1.getSubscriptionLimits);
/**
 * @route POST /api/v1/rbac/validate-access
 * @desc Validate user access to specific resource
 * @access Private
 */
router.post('/validate-access', jwtAuth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        resource: joi_1.default.string().required(),
        action: joi_1.default.string().required(),
        conditions: joi_1.default.object().optional()
    })
}), rbacController_1.validateAccess);
exports.default = router;
//# sourceMappingURL=rbacRoutes.js.map