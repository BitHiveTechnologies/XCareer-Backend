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

/**
 * Admin: Create a testimonial directly (already approved unless told otherwise).
 * Separate from submitTestimonial, which is a user submission awaiting moderation.
 */
export const createTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, role, content, rating, avatar, linkedinUrl, isApproved, isVerified } = req.body;

    if (!name || !role || !content || rating === undefined) {
      res.status(400).json({ success: false, message: 'name, role, content and rating are required' });
      return;
    }

    const testimonial = new Testimonial({
      name,
      role,
      content,
      rating,
      avatar,
      linkedinUrl,
      isApproved: isApproved !== undefined ? isApproved : true,
      isVerified: isVerified !== undefined ? isVerified : false
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial
    });
  } catch (error) {
    logger.error('Create testimonial failed', { error });
    res.status(500).json({ success: false, message: 'Failed to create testimonial' });
  }
};

/**
 * Admin: Update any field of a testimonial.
 */
export const updateTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, content, rating, avatar, linkedinUrl, isApproved, isVerified } = req.body;

    // Only set what was sent, so a partial edit doesn't blank the rest.
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (content !== undefined) updates.content = content;
    if (rating !== undefined) updates.rating = rating;
    if (avatar !== undefined) updates.avatar = avatar;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (isApproved !== undefined) updates.isApproved = isApproved;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const testimonial = await Testimonial.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!testimonial) {
      res.status(404).json({ success: false, message: 'Testimonial not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial
    });
  } catch (error) {
    logger.error('Update testimonial failed', { error });
    res.status(500).json({ success: false, message: 'Failed to update testimonial' });
  }
};

/**
 * Admin: Delete a testimonial.
 */
export const deleteTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      res.status(404).json({ success: false, message: 'Testimonial not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    logger.error('Delete testimonial failed', { error });
    res.status(500).json({ success: false, message: 'Failed to delete testimonial' });
  }
};
