import mongoose, { Schema } from 'mongoose';
import { IResume } from './interfaces';

const resumeSchema = new Schema<IResume>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Resume data is required']
  },
  templateId: {
    type: String,
    required: [true, 'Template ID is required'],
    default: 'vinod'
  },
  previewUrl: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ templateId: 1 });

// Create and export the model
export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
