import { Request, Response } from 'express';
import { Resume } from '../models/Resume';
import { logger } from '../utils/logger';

/**
 * Get current user's resume
 */
export const getMyResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: true, // Returning success true but no data if not found is also an option, but usually we want to know if authenticated
        error: { message: 'Authentication required' }
      });
      return;
    }

    const resume = await Resume.findOne({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: { resume },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get my resume failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: { message: 'Failed to get resume' }
    });
  }
};

/**
 * Create or update user's resume
 */
export const saveResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { data, templateId, isPublic } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    if (!data) {
      res.status(400).json({
        success: false,
        error: { message: 'Resume data is required' }
      });
      return;
    }

    // Upsert logic
    const resume = await Resume.findOneAndUpdate(
      { userId },
      { 
        userId,
        data,
        templateId: templateId || 'vinod',
        isPublic: isPublic !== undefined ? isPublic : false
      },
      { new: true, upsert: true, runValidators: true }
    );

    logger.info('Resume saved', { userId, resumeId: resume._id });

    res.status(200).json({
      success: true,
      data: { resume },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Save resume failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: { message: 'Failed to save resume' }
    });
  }
};

/**
 * Get a public resume by ID (for sharing)
 */
export const getPublicResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, isPublic: true })
      .populate('userId', 'name email');

    if (!resume) {
      res.status(404).json({
        success: false,
        error: { message: 'Resume not found or is not public' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { resume },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get public resume failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      resumeId: req.params.resumeId
    });

    res.status(500).json({
      success: false,
      error: { message: 'Failed to get public resume' }
    });
  }
};
