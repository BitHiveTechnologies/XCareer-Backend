import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdmin } from './interfaces';
import { config } from '../config/environment';

// Admin schema
const adminSchema = new Schema<IAdmin>({
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
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  name: {
    type: String,
    required: [true, 'Admin name is required'],
    trim: true,
    maxlength: [100, 'Admin name cannot exceed 100 characters']
  },
  role: {
    type: String,
    required: [true, 'Admin role is required'],
    enum: {
      values: ['super_admin', 'admin'],
      message: 'Admin role must be either super_admin or admin'
    },
    default: 'admin'
  },
  permissions: {
    type: [String],
    default: [],
    validate: {
      validator: function(value: string[]) {
        const validPermissions = [
          'user_management',
          'job_management',
          'subscription_management',
          'admin_management',
          'system_settings',
          'analytics_view',
          'payment_management',
          'email_management'
        ];
        
        return value.every(permission => validPermissions.includes(permission));
      },
      message: 'Invalid permission specified'
    }
  },
  isActive: {
    type: Boolean,
    default: true
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
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with configured rounds
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-update middleware to hash password on updates
adminSchema.pre('findOneAndUpdate', async function(next) {
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
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if admin has specific permission
adminSchema.methods.hasPermission = function(permission: string): boolean {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  return this.permissions.includes(permission);
};

// Instance method to check if admin has any of the specified permissions
adminSchema.methods.hasAnyPermission = function(permissions: string[]): boolean {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  return permissions.some(permission => this.permissions.includes(permission));
};

// Instance method to check if admin has all of the specified permissions
adminSchema.methods.hasAllPermissions = function(permissions: string[]): boolean {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  return permissions.every(permission => this.permissions.includes(permission));
};

// Instance method to add permission
adminSchema.methods.addPermission = function(permission: string): boolean {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    return true;
  }
  return false;
};

// Instance method to remove permission
adminSchema.methods.removePermission = function(permission: string): boolean {
  const index = this.permissions.indexOf(permission);
  if (index > -1) {
    this.permissions.splice(index, 1);
    return true;
  }
  return false;
};

// Instance method to get role display name
adminSchema.methods.getRoleDisplay = function(): string {
  return this.role === 'super_admin' ? 'Super Administrator' : 'Administrator';
};

// Static method to find admins by role
adminSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

// Static method to find active admins
adminSchema.statics.findActiveAdmins = function() {
  return this.find({ isActive: true });
};

// Static method to find admins with specific permission
adminSchema.statics.findByPermission = function(permission: string) {
  return this.find({
    $or: [
      { role: 'super_admin' },
      { permissions: permission }
    ],
    isActive: true
  });
};

// Virtual for role display
adminSchema.virtual('roleDisplay').get(function() {
  return (this as any).getRoleDisplay();
});

// Virtual for permissions display
adminSchema.virtual('permissionsDisplay').get(function() {
  if (this.role === 'super_admin') {
    return 'All Permissions';
  }
  return this.permissions.length > 0 ? this.permissions.join(', ') : 'No specific permissions';
});

// Ensure virtuals are serialized
adminSchema.set('toJSON', { virtuals: true });

// Create and export the model
export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

// Export the schema for testing purposes
export { adminSchema };
