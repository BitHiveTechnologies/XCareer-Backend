"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplatesByExperienceLevel = exports.getTemplatesByIndustry = exports.getTemplatesByCategory = exports.getPopularTemplates = exports.rateTemplate = exports.downloadTemplate = exports.getTemplateById = exports.getAllTemplates = void 0;
const ResumeTemplate_1 = __importDefault(require("../models/ResumeTemplate"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
/**
 * Get all resume templates with filtering
 */
const getAllTemplates = async (req, res) => {
    try {
        const { category, industry, experienceLevel, subscriptionTier, tags, search, page = 1, limit = 10, sortBy = 'downloadCount', sortOrder = 'desc' } = req.query;
        const userId = req.user?.id;
        let userTier = 'basic';
        // Get user's subscription tier if authenticated
        if (userId) {
            try {
                const user = await User_1.User.findById(userId).select('subscriptionPlan');
                if (user) {
                    userTier = user.subscriptionPlan || 'basic';
                }
            }
            catch (subscriptionError) {
                logger_1.logger.warn('Failed to get user subscription tier', {
                    error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error',
                    userId
                });
            }
        }
        // Build query
        const query = { isActive: true };
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
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        // Filter by user's subscription tier (only if no specific subscriptionTier query is provided)
        if (!subscriptionTier) {
            if (userId) {
                // Authenticated user - filter based on their subscription tier
                const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
                const userTierLevel = tierHierarchy[userTier] || 0;
                const accessibleTiers = Object.keys(tierHierarchy).filter(tier => tierHierarchy[tier] <= userTierLevel);
                query.subscriptionTier = { $in: accessibleTiers };
            }
            else {
                // Unauthenticated user - only show basic templates
                query.subscriptionTier = 'basic';
            }
        }
        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Sorting
        const sortOptions = {};
        if (sortBy === 'downloadCount') {
            sortOptions.downloadCount = sortOrder === 'desc' ? -1 : 1;
        }
        else if (sortBy === 'rating') {
            sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
        }
        else if (sortBy === 'createdAt') {
            sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        }
        else {
            sortOptions.isPopular = -1;
            sortOptions.downloadCount = -1;
        }
        // Execute query
        const templates = await ResumeTemplate_1.default.find(query)
            .populate('createdBy', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        const total = await ResumeTemplate_1.default.countDocuments(query);
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
    }
    catch (error) {
        logger_1.logger.error('Get all templates failed', {
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
exports.getAllTemplates = getAllTemplates;
/**
 * Get a specific template by ID
 */
const getTemplateById = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user?.id;
        const template = await ResumeTemplate_1.default.findById(templateId)
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
            const user = await User_1.User.findById(userId).select('subscriptionPlan');
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
        }
        else if (template.subscriptionTier !== 'basic') {
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
    }
    catch (error) {
        logger_1.logger.error('Get template by ID failed', {
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
exports.getTemplateById = getTemplateById;
/**
 * Download a template (increment download count)
 */
const downloadTemplate = async (req, res) => {
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
        const template = await ResumeTemplate_1.default.findById(templateId);
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
        const user = await User_1.User.findById(userId).select('subscriptionPlan');
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
        logger_1.logger.info('Template downloaded', {
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
    }
    catch (error) {
        logger_1.logger.error('Download template failed', {
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
exports.downloadTemplate = downloadTemplate;
/**
 * Rate a template
 */
const rateTemplate = async (req, res) => {
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
        const template = await ResumeTemplate_1.default.findById(templateId);
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
        logger_1.logger.info('Template rated', {
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
    }
    catch (error) {
        logger_1.logger.error('Rate template failed', {
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
exports.rateTemplate = rateTemplate;
/**
 * Get popular templates
 */
const getPopularTemplates = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const limitNum = parseInt(limit) || 10;
        const templates = await ResumeTemplate_1.default.getPopularTemplates(limitNum);
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
    }
    catch (error) {
        logger_1.logger.error('Get popular templates failed', {
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
exports.getPopularTemplates = getPopularTemplates;
/**
 * Get templates by category
 */
const getTemplatesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const templates = await ResumeTemplate_1.default.findByCategory(category);
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
    }
    catch (error) {
        logger_1.logger.error('Get templates by category failed', {
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
exports.getTemplatesByCategory = getTemplatesByCategory;
/**
 * Get templates by industry
 */
const getTemplatesByIndustry = async (req, res) => {
    try {
        const { industry } = req.params;
        const templates = await ResumeTemplate_1.default.findByIndustry(industry);
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
    }
    catch (error) {
        logger_1.logger.error('Get templates by industry failed', {
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
exports.getTemplatesByIndustry = getTemplatesByIndustry;
/**
 * Get templates by experience level
 */
const getTemplatesByExperienceLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const templates = await ResumeTemplate_1.default.findByExperienceLevel(level);
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
    }
    catch (error) {
        logger_1.logger.error('Get templates by experience level failed', {
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
exports.getTemplatesByExperienceLevel = getTemplatesByExperienceLevel;
//# sourceMappingURL=resumeTemplateController.js.map