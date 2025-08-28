import mongoose, { Schema } from 'mongoose';
import { IJobApplication } from './interfaces';

// Job Application schema
const jobApplicationSchema = new Schema<IJobApplication>({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    required: [true, 'Application status is required'],
    enum: {
      values: ['applied', 'shortlisted', 'rejected', 'withdrawn'],
      message: 'Status must be applied, shortlisted, rejected, or withdrawn'
    },
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    required: [true, 'Application date is required'],
    default: Date.now
  },
  resumeUrl: {
    type: String,
    required: [true, 'Resume URL is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid resume URL']
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for performance
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ userId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });
jobApplicationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
jobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, status: 1 });

// Pre-save middleware to validate unique application
jobApplicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingApplication = await mongoose.model('JobApplication').findOne({
      jobId: this.jobId,
      userId: this.userId
    });
    
    if (existingApplication) {
      return next(new Error('User has already applied for this job'));
    }
  }
  next();
});

// Instance method to check if application can be withdrawn
jobApplicationSchema.methods.canWithdraw = function(): boolean {
  return this.status === 'applied';
};

// Instance method to check if application can be updated by admin
jobApplicationSchema.methods.canUpdateStatus = function(): boolean {
  return this.status !== 'withdrawn';
};

// Instance method to get application age in days
jobApplicationSchema.methods.getApplicationAge = function(): number {
  const now = new Date();
  const appliedDate = new Date(this.appliedAt);
  const diffTime = now.getTime() - appliedDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to get application statistics
jobApplicationSchema.statics.getApplicationStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get applications by job
jobApplicationSchema.statics.getApplicationsByJob = async function(jobId: string, options: any = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  const query: any = { jobId };
  if (status) {
    query.status = status;
  }
  
  const applications = await this.find(query)
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email profile')
    .populate('jobId', 'title company type');
    
  const total = await this.countDocuments(query);
  
  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get user applications
jobApplicationSchema.statics.getUserApplications = async function(userId: string, options: any = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  const query: any = { userId };
  if (status) {
    query.status = status;
  }
  
  const applications = await this.find(query)
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('jobId', 'title company type location applicationDeadline')
    .populate('userId', 'name email');
    
  const total = await this.countDocuments(query);
  
  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Create and export the model
export const JobApplication = mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
