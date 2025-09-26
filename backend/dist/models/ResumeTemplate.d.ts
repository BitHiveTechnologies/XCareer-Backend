import mongoose, { Document } from 'mongoose';
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
        preview: string;
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
    incrementDownloadCount(): Promise<IResumeTemplate>;
    updateRating(newRating: number): Promise<IResumeTemplate>;
    isAccessibleByTier(userTier: string): boolean;
}
export interface IResumeTemplateModel extends mongoose.Model<IResumeTemplate> {
    findByCategory(category: string): Promise<IResumeTemplate[]>;
    findByIndustry(industry: string): Promise<IResumeTemplate[]>;
    findByExperienceLevel(level: string): Promise<IResumeTemplate[]>;
    findAccessibleByTier(userTier: string): Promise<IResumeTemplate[]>;
    getPopularTemplates(limit?: number): Promise<IResumeTemplate[]>;
    getTemplatesByTags(tags: string[]): Promise<IResumeTemplate[]>;
}
declare const ResumeTemplate: IResumeTemplateModel;
export default ResumeTemplate;
//# sourceMappingURL=ResumeTemplate.d.ts.map