import mongoose, { Schema } from 'mongoose';
import { ITestimonial } from './interfaces';

const testimonialSchema = new Schema<ITestimonial>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  avatar: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  linkedinUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Testimonial = mongoose.model<ITestimonial>('Testimonial', testimonialSchema);
