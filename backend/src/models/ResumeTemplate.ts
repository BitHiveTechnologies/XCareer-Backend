import mongoose, { Document, Schema } from 'mongoose';

// Resume Template interface
export interface IResumeTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'academic' | 'technical' | 'executive';
  industry: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  templateData: {
    sections: Array<{
      id: string;
      name: string;
      type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'achievements' | 'references';
      required: boolean;
      order: number;
      fields: Array<{
        id: string;
        name: string;
        type: 'text' | 'textarea' | 'date' | 'email' | 'phone' | 'url' | 'list' | 'rating';
        required: boolean;
        placeholder?: string;
        validation?: {
          minLength?: number;
          maxLength?: number;
          pattern?: string;
        };
      }>;
    }>;
    styling: {
      fontFamily: string;
      fontSize: number;
      colorScheme: string;
      layout: 'single-column' | 'two-column' | 'modern' | 'classic';
    };
    preview: string; // Base64 encoded preview image
  };
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  isPopular: boolean;
  downloadCount: number;
  rating: number;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementDownloadCount(): Promise<IResumeTemplate>;
  updateRating(newRating: number): Promise<IResumeTemplate>;
  isAccessibleByTier(userTier: string): boolean;
}

// Resume Template Schema
const resumeTemplateSchema = new Schema<IResumeTemplate>({
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
    type: Schema.Types.ObjectId,
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
resumeTemplateSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

resumeTemplateSchema.methods.updateRating = function(newRating: number) {
  // Simple average rating calculation
  const totalRatings = this.downloadCount;
  const currentTotal = this.rating * totalRatings;
  const newTotal = currentTotal + newRating;
  this.rating = newTotal / (totalRatings + 1);
  return this.save();
};

resumeTemplateSchema.methods.isAccessibleByTier = function(userTier: string): boolean {
  const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
  const templateTierLevel = tierHierarchy[this.subscriptionTier as keyof typeof tierHierarchy] || 0;
  return userTierLevel >= templateTierLevel;
};

// Static methods
resumeTemplateSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};

resumeTemplateSchema.statics.findByIndustry = function(industry: string) {
  return this.find({ industry: industry, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};

resumeTemplateSchema.statics.findByExperienceLevel = function(level: string) {
  return this.find({ experienceLevel: level, isActive: true }).sort({ isPopular: -1, downloadCount: -1 });
};

resumeTemplateSchema.statics.findAccessibleByTier = function(userTier: string) {
  const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
  
  const accessibleTiers = Object.keys(tierHierarchy).filter(tier => 
    tierHierarchy[tier as keyof typeof tierHierarchy] <= userTierLevel
  );
  
  return this.find({ 
    subscriptionTier: { $in: accessibleTiers }, 
    isActive: true 
  }).sort({ isPopular: -1, downloadCount: -1 });
};

resumeTemplateSchema.statics.getPopularTemplates = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ isPopular: -1, downloadCount: -1, rating: -1 })
    .limit(limit);
};

resumeTemplateSchema.statics.getTemplatesByTags = function(tags: string[]) {
  return this.find({ 
    tags: { $in: tags }, 
    isActive: true 
  }).sort({ isPopular: -1, downloadCount: -1 });
};

// Pre-save middleware
resumeTemplateSchema.pre('save', function(next) {
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
resumeTemplateSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  if (update.templateData && update.templateData.sections) {
    update.templateData.sections.sort((a: any, b: any) => a.order - b.order);
  }
  
  if (update.tags) {
    update.tags = [...new Set(update.tags)];
  }
  
  next();
});

// Static methods interface
export interface IResumeTemplateModel extends mongoose.Model<IResumeTemplate> {
  findByCategory(category: string): Promise<IResumeTemplate[]>;
  findByIndustry(industry: string): Promise<IResumeTemplate[]>;
  findByExperienceLevel(level: string): Promise<IResumeTemplate[]>;
  findAccessibleByTier(userTier: string): Promise<IResumeTemplate[]>;
  getPopularTemplates(limit?: number): Promise<IResumeTemplate[]>;
  getTemplatesByTags(tags: string[]): Promise<IResumeTemplate[]>;
}

// Create and export the model
const ResumeTemplate = mongoose.model<IResumeTemplate, IResumeTemplateModel>('ResumeTemplate', resumeTemplateSchema);

export default ResumeTemplate;
