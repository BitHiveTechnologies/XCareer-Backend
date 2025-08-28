import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from './interfaces';
import { config } from '../config/environment';

// User schema
const userSchema = new Schema<IUser>({
  clerkUserId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using Clerk
      return !this.clerkUserId;
    },
    minlength: [8, 'Password must be at least 8 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'super_admin'],
      message: 'Role must be user, admin, or super_admin'
    },
    default: 'user'
  },
  subscriptionPlan: {
    type: String,
    enum: {
      values: ['basic', 'premium'],
      message: 'Subscription plan must be either basic or premium'
    },
    default: 'basic'
  },
  subscriptionStatus: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'expired'],
      message: 'Subscription status must be active, inactive, or expired'
    },
    default: 'inactive'
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ clerkUserId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ subscriptionEndDate: 1 });
userSchema.index({ isProfileComplete: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !(this as any).password) return next();

  try {
    // Hash password with configured rounds
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-update middleware to hash password on updates
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      next(error as Error);
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If no password stored (Clerk user), return false
    if (!(this as any).password) return false;
    return await bcrypt.compare(candidatePassword, (this as any).password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if subscription is active
userSchema.methods.isSubscriptionActive = function(): boolean {
  if ((this as any).subscriptionStatus !== 'active') return false;
  if (!(this as any).subscriptionEndDate) return false;
  return new Date() < (this as any).subscriptionEndDate;
};

// Instance method to get subscription days remaining
userSchema.methods.getSubscriptionDaysRemaining = function(): number {
  if (!(this as any).isSubscriptionActive()) return 0;
  const now = new Date();
  const endDate = new Date((this as any).subscriptionEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to find users by subscription status
userSchema.statics.findBySubscriptionStatus = function(status: string) {
  return this.find({ subscriptionStatus: status });
};

// Static method to find users with expiring subscriptions
userSchema.statics.findExpiringSubscriptions = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    subscriptionStatus: 'active',
    subscriptionEndDate: { $lte: futureDate }
  });
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return (this as any).name;
});

// Virtual for subscription status with expiry info
userSchema.virtual('subscriptionInfo').get(function() {
  return {
    status: (this as any).subscriptionStatus,
    plan: (this as any).subscriptionPlan,
    isActive: (this as any).isSubscriptionActive(),
    daysRemaining: (this as any).getSubscriptionDaysRemaining(),
    startDate: (this as any).subscriptionStartDate,
    endDate: (this as any).subscriptionEndDate
  };
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);

// Export the schema for testing purposes
export { userSchema };
