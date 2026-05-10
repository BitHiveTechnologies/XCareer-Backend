"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateTestimonial = exports.getAllTestimonials = exports.submitTestimonial = exports.getApprovedTestimonials = void 0;
const Testimonial_1 = require("../models/Testimonial");
const logger_1 = require("../utils/logger");
/**
 * Get all approved testimonials
 */
const getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial_1.Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        logger_1.logger.error('Get approved testimonials failed', { error });
        res.status(500).json({ success: false, message: 'Failed to get testimonials' });
    }
};
exports.getApprovedTestimonials = getApprovedTestimonials;
/**
 * Submit a new testimonial
 */
const submitTestimonial = async (req, res) => {
    try {
        const { name, role, content, rating, linkedinUrl, avatar } = req.body;
        const userId = req.user?.id;
        const testimonial = new Testimonial_1.Testimonial({
            userId,
            name,
            role,
            content,
            rating,
            linkedinUrl,
            avatar,
            isApproved: false, // Requires admin approval
            isVerified: !!userId
        });
        await testimonial.save();
        res.status(201).json({
            success: true,
            message: 'Testimonial submitted successfully and is awaiting approval',
            data: testimonial
        });
    }
    catch (error) {
        logger_1.logger.error('Submit testimonial failed', { error });
        res.status(500).json({ success: false, message: 'Failed to submit testimonial' });
    }
};
exports.submitTestimonial = submitTestimonial;
/**
 * Admin: Get all testimonials (for moderation)
 */
const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial_1.Testimonial.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        logger_1.logger.error('Get all testimonials failed', { error });
        res.status(500).json({ success: false, message: 'Failed to get testimonials' });
    }
};
exports.getAllTestimonials = getAllTestimonials;
/**
 * Admin: Approve/Reject testimonial
 */
const moderateTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved } = req.body;
        const testimonial = await Testimonial_1.Testimonial.findByIdAndUpdate(id, { isApproved }, { new: true });
        if (!testimonial) {
            res.status(404).json({ success: false, message: 'Testimonial not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: `Testimonial ${isApproved ? 'approved' : 'rejected'} successfully`,
            data: testimonial
        });
    }
    catch (error) {
        logger_1.logger.error('Moderate testimonial failed', { error });
        res.status(500).json({ success: false, message: 'Failed to moderate testimonial' });
    }
};
exports.moderateTestimonial = moderateTestimonial;
//# sourceMappingURL=testimonialController.js.map