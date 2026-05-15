import mongoose, { Schema } from 'mongoose';

export interface IJobNotification extends mongoose.Document {
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  emailSent: boolean;
  emailSentAt?: Date | null;
  emailStatus: 'pending' | 'sent' | 'failed';
  // Enhanced tracking fields
  matchScore: number;
  matchReasons: string[];
  isAutomatic: boolean;          // true = scheduler, false = manual admin trigger
  triggeredBy?: string;          // admin userId if manual
  retryCount: number;
  lastRetryAt?: Date | null;
  deliveryStatus?: string;       // future: 'delivered', 'bounced', etc.
  createdAt: Date;
  updatedAt: Date;
}

const jobNotificationSchema = new Schema<IJobNotification>({
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
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  emailStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 110 // can exceed 100 with bonuses
  },
  matchReasons: {
    type: [String],
    default: []
  },
  isAutomatic: {
    type: Boolean,
    default: true
  },
  triggeredBy: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date,
    default: null
  },
  deliveryStatus: {
    type: String,
    default: null
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
jobNotificationSchema.index({ jobId: 1 });
jobNotificationSchema.index({ userId: 1 });
jobNotificationSchema.index({ emailStatus: 1 });
jobNotificationSchema.index({ createdAt: -1 });
jobNotificationSchema.index({ isAutomatic: 1 });
jobNotificationSchema.index({ retryCount: 1, emailStatus: 1 });

// Index for performance — one notification per user per job
jobNotificationSchema.index({ jobId: 1, userId: 1 });
jobNotificationSchema.index({ userId: 1, emailStatus: 1 });
jobNotificationSchema.index({ jobId: 1, emailStatus: 1 });

// Pre-save: auto-set emailSentAt
jobNotificationSchema.pre('save', function(next) {
  if (this.emailSent && !this.emailSentAt) {
    this.emailSentAt = new Date();
  }
  next();
});

// Statics
jobNotificationSchema.statics.findPendingNotifications = function() {
  return this.find({ emailStatus: 'pending' });
};

jobNotificationSchema.statics.findFailedNotifications = function(maxRetries = 3) {
  return this.find({ emailStatus: 'failed', retryCount: { $lt: maxRetries } });
};

jobNotificationSchema.statics.findByJob = function(jobId: string) {
  return this.find({ jobId });
};

jobNotificationSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId });
};

jobNotificationSchema.statics.getNotificationStats = function() {
  return this.aggregate([
    { $group: { _id: '$emailStatus', count: { $sum: 1 } } }
  ]);
};

export const JobNotification = mongoose.model<IJobNotification>('JobNotification', jobNotificationSchema);
export { jobNotificationSchema };
