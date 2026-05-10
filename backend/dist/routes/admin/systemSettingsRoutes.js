"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemSettingsController_1 = require("../../controllers/admin/systemSettingsController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const router = (0, express_1.Router)();
// Public routes (metrics for home page)
router.get('/metrics', systemSettingsController_1.getHomeMetrics);
// Admin routes
router.use(jwtAuth_1.authenticate);
router.use(jwtAuth_1.requireAdmin);
router.get('/', systemSettingsController_1.getSystemSettings);
router.get('/:key', systemSettingsController_1.getSettingByKey);
router.post('/', systemSettingsController_1.updateSystemSetting);
exports.default = router;
//# sourceMappingURL=systemSettingsRoutes.js.map