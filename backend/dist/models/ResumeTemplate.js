"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Resume Template Schema
const resumeTemplateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        maxlength: [100, 'Template name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Template description is required'],
        trim: true,
        maxlength: [500, 'Template description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Template category is required'],
        enum: {
            values: ['professional', 'creative', 'academic', 'technical', 'executive'],
            message: 'Category must be one of: professional, creative, academic, technical, executive'
        }
    },
    industry: [{
            type: String,
            required: true,
            trim: true
        }],
    experienceLevel: {
        type: String,
        required: [true, 'Experience level is required'],
        enum: {
            values: ['entry', 'mid', 'senior', 'executive'],
            message: 'Experience level must be one of: entry, mid, senior, executive'
        }
    },
    templateData: {
        sections: [{
                id: {
                    type: String,
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                type: {
                    type: String,
                    required: true,
                    enum: ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'references']
                },
                required: {
                    type: Boolean,
                    default: false
                },
                order: {
                    type: Number,
                    required: true
                },
                fields: [{
                        id: {
                            type: String,
                            required: true
                        },
                        name: {
                            type: String,
                            required: true
                        },
                        type: {
                            type: String,
                            required: true,
                            enum: ['text', 'textarea', 'date', 'email', 'phone', 'url', 'list', 'rating']
                        },
                        required: {
                            type: Boolean,
                            default: false
                        },
                        placeholder: String,
                        validation: {
                            minLength: Number,
                            maxLength: Number,
                            pattern: String
                        }
                    }]
            }],
        styling: {
            fontFamily: {
                type: String,
                default: 'Arial'
            },
            fontSize: {
                type: Number,
                default: 12
            },
            colorScheme: {
                type: String,
                default: 'professional'
            },
            layout: {
                type: String,
                enum: ['single-column', 'two-column', 'modern', 'classic'],
                default: 'single-column'
            }
        },
        preview: {
            type: String,
            required: [true, 'Template preview is required']
        }
    },
    subscriptionTier: {
        type: String,
        required: [true, 'Subscription tier is required'],
        enum: {
            values: ['basic', 'premium', 'enterprise'],
            message: 'Subscription tier must be one of: basic, premium, enterprise'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    tags: [{
            type: String,
            trim: true
        }],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Template creator is required']
    }
}, {
    timestamps: true
});
// Indexes for better performance
resumeTemplateSchema.index({ category: 1, experienceLevel: 1 });
resumeTemplateSchema.index({ subscriptionTier: 1, isActive: 1 });
resumeTemplateSchema.index({ industry: 1 });
resumeTemplateSchema.index({ isPopular: 1, downloadCount: -1 });
resumeTemplateSchema.index({ rating: -1 });
resumeTemplateSchema.index({ tags: 1 });
// Instance methods
resumeTemplateSchema.methods.incrementDownloadCount = function () {
    this.downloadCount += 1;
    return this.save();
};
resumeTemplateSchema.methods.updateRating = function (newRating) {
    // Simple average rating calculation
    const totalRatings = this.downloadCount;
    const currentTotal = this.rating * totalRatings;
    const newTotal = currentTotal + newRating;
    this.rating = newTotal / (totalRatings + 1);
    return this.save();
};
resumeTemplateSchema.methods.isAccessibleByTier = function (userTier) {
    const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[userTier] || 0;
    const templateTierLevel = tierHierarchy[this.subscriptionTier] || 0;
    return userTierLevel >= templateTierLevel;
};
// Static methods
resumeTemplateSchema.statics.findByCategory = function (category) {
    return this.find({ category, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};
resumeTemplateSchema.statics.findByIndustry = function (industry) {
    return this.find({ industry: industry, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};
resumeTemplateSchema.statics.findByExperienceLevel = function (level) {
    return this.find({ experienceLevel: level, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};
resumeTemplateSchema.statics.findAccessibleByTier = function (userTier) {
    const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[userTier] || 0;
    const accessibleTiers = Object.keys(tierHierarchy).filter(tier => tierHierarchy[tier] <= userTierLevel);
    return this.find({
        subscriptionTier: { $in: accessibleTiers },
        isActive: true
    }).sort({ isPopular: -1, downloadCount: -1 });
};
resumeTemplateSchema.statics.getPopularTemplates = function (limit = 10) {
    return this.find({ isActive: true })
        .sort({ isPopular: -1, downloadCount: -1, rating: -1 })
        .limit(limit);
};
resumeTemplateSchema.statics.getTemplatesByTags = function (tags) {
    return this.find({
        tags: { $in: tags },
        isActive: true
    }).sort({ isPopular: -1, downloadCount: -1 });
};
// Pre-save middleware
resumeTemplateSchema.pre('save', function (next) {
    // Ensure sections are ordered correctly
    if (this.templateData && this.templateData.sections) {
        this.templateData.sections.sort((a, b) => a.order - b.order);
    }
    // Ensure tags are unique
    if (this.tags) {
        this.tags = [...new Set(this.tags)];
    }
    next();
});
// Pre-update middleware
resumeTemplateSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.templateData && update.templateData.sections) {
        update.templateData.sections.sort((a, b) => a.order - b.order);
    }
    if (update.tags) {
        update.tags = [...new Set(update.tags)];
    }
    next();
});
// Create and export the model
const ResumeTemplate = mongoose_1.default.model('ResumeTemplate', resumeTemplateSchema);
exports.default = ResumeTemplate;
//# sourceMappingURL=ResumeTemplate.js.map