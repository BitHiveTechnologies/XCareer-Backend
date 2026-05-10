"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logoController_1 = require("../../controllers/admin/logoController");
const jwtAuth_1 = require("../../middleware/jwtAuth");
const router = (0, express_1.Router)();
router.use(jwtAuth_1.authenticate);
router.use(jwtAuth_1.requireAdmin);
router.get('/', logoController_1.listLogos);
router.post('/upload', logoController_1.uploadLogo);
router.delete('/', logoController_1.deleteLogo);
exports.default = router;
//# sourceMappingURL=logoRoutes.js.map