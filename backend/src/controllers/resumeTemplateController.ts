import { Request, Response } from 'express';
import ResumeTemplate from '../models/ResumeTemplate';
import { User } from '../models/User';
import { logger } from '../utils/logger';

/**
 * Get all resume templates with filtering
 */
export const getAllTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      industry,
      experienceLevel,
      subscriptionTier,
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'downloadCount',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user?.id;
    let userTier = 'basic';

    // Get user's subscription tier if authenticated
    if (userId) {
      try {
        const user = await User.findById(userId).select('subscriptionPlan');
        if (user) {
          userTier = user.subscriptionPlan || 'basic';
        }
      } catch (subscriptionError) {
        logger.warn('Failed to get user subscription tier', {
          error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error',
          userId
        });
      }
    }

    // Build query
    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (industry) {
      query.industry = { $in: Array.isArray(industry) ? industry : [industry] };
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (subscriptionTier) {
      query.subscriptionTier = subscriptionTier;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Filter by user's subscription tier (only if no specific subscriptionTier query is provided)
    if (!subscriptionTier) {
      if (userId) {
        // Authenticated user - filter based on their subscription tier
        const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
        const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
        
        const accessibleTiers = Object.keys(tierHierarchy).filter(tier => 
          tierHierarchy[tier as keyof typeof tierHierarchy] <= userTierLevel
        );
        
        query.subscriptionTier = { $in: accessibleTiers };
      } else {
        // Unauthenticated user - only show basic templates
        query.subscriptionTier = 'basic';
      }
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    if (sortBy === 'downloadCount') {
      sortOptions.downloadCount = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.isPopular = -1;
      sortOptions.downloadCount = -1;
    }

    // Execute query
    const templates = await ResumeTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await ResumeTemplate.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          preview: template.templateData.preview,
          createdBy: template.createdBy,
          createdAt: template.createdAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get all templates failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get templates'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get a specific template by ID
 */
export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;

    const template = await ResumeTemplate.findById(templateId)
      .populate('createdBy', 'name email');

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user can access this template
    if (userId) {
      const user = await User.findById(userId).select('subscriptionPlan');
      if (user && !template.isAccessibleByTier(user.subscriptionPlan || 'basic')) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Subscription upgrade required to access this template'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    } else if (template.subscriptionTier !== 'basic') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Authentication required to access this template'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          templateData: template.templateData,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get template by ID failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.templateId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get template'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Download a template (increment download count)
 */
export const downloadTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const template = await ResumeTemplate.findById(templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user can access this template
    const user = await User.findById(userId).select('subscriptionPlan');
    if (user && !template.isAccessibleByTier(user.subscriptionPlan || 'basic')) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Subscription upgrade required to download this template'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Increment download count
    await template.incrementDownloadCount();

    logger.info('Template downloaded', {
      templateId,
      userId,
      templateName: template.name,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Template downloaded successfully',
      data: {
        templateId: template._id,
        downloadCount: template.downloadCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Download template failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.templateId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to download template'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Rate a template
 */
export const rateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { rating } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Rating must be between 1 and 5'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const template = await ResumeTemplate.findById(templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update rating
    await template.updateRating(rating);

    logger.info('Template rated', {
      templateId,
      userId,
      rating,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Template rated successfully',
      data: {
        templateId: template._id,
        rating: template.rating
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Rate template failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.templateId,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to rate template'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get popular templates
 */
export const getPopularTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    const templates = await ResumeTemplate.getPopularTemplates(limitNum);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          preview: template.templateData.preview
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get popular templates failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get popular templates'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    const templates = await ResumeTemplate.findByCategory(category);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          preview: template.templateData.preview
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get templates by category failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      category: req.params.category,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get templates by category'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get templates by industry
 */
export const getTemplatesByIndustry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry } = req.params;

    const templates = await ResumeTemplate.findByIndustry(industry);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          preview: template.templateData.preview
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get templates by industry failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      industry: req.params.industry,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get templates by industry'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get templates by experience level
 */
export const getTemplatesByExperienceLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.params;

    const templates = await ResumeTemplate.findByExperienceLevel(level);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          experienceLevel: template.experienceLevel,
          subscriptionTier: template.subscriptionTier,
          isPopular: template.isPopular,
          downloadCount: template.downloadCount,
          rating: template.rating,
          tags: template.tags,
          preview: template.templateData.preview
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get templates by experience level failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      level: req.params.level,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get templates by experience level'
      },
      timestamp: new Date().toISOString()
    });
  }
};
