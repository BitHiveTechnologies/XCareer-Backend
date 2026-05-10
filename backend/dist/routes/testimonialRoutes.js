"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonialController_1 = require("../controllers/testimonialController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', testimonialController_1.getApprovedTestimonials);
// Protected routes (for users to submit)
router.post('/', jwtAuth_1.authenticate, testimonialController_1.submitTestimonial);
// Admin routes
router.get('/admin', jwtAuth_1.authenticate, jwtAuth_1.requireAdmin, testimonialController_1.getAllTestimonials);
router.patch('/:id/moderate', jwtAuth_1.authenticate, jwtAuth_1.requireAdmin, testimonialController_1.moderateTestimonial);
exports.default = router;
//# sourceMappingURL=testimonialRoutes.js.map