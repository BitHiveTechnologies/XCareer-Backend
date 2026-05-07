import { Request, Response } from 'express';
import { Testimonial } from '../models/Testimonial';
import { logger } from '../utils/logger';

/**
 * Get all approved testimonials
 */
export const getApprovedTestimonials = async (req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    logger.error('Get approved testimonials failed', { error });
    res.status(500).json({ success: false, message: 'Failed to get testimonials' });
  }
};

/**
 * Submit a new testimonial
 */
export const submitTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, role, content, rating, linkedinUrl, avatar } = req.body;
    const userId = req.user?.id;

    const testimonial = new Testimonial({
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
  } catch (error) {
    logger.error('Submit testimonial failed', { error });
    res.status(500).json({ success: false, message: 'Failed to submit testimonial' });
  }
};

/**
 * Admin: Get all testimonials (for moderation)
 */
export const getAllTestimonials = async (req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    logger.error('Get all testimonials failed', { error });
    res.status(500).json({ success: false, message: 'Failed to get testimonials' });
  }
};

/**
 * Admin: Approve/Reject testimonial
 */
export const moderateTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(id, { isApproved }, { new: true });

    if (!testimonial) {
      res.status(404).json({ success: false, message: 'Testimonial not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Testimonial ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: testimonial
    });
  } catch (error) {
    logger.error('Moderate testimonial failed', { error });
    res.status(500).json({ success: false, message: 'Failed to moderate testimonial' });
  }
};
