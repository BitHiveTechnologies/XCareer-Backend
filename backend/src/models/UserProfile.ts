import mongoose, { Schema } from 'mongoose';
import { IUserProfile } from './interfaces';

// User Profile schema
const userProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        const monthDiff = today.getMonth() - value.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
          return age - 1 >= 16; // Minimum age 16
        }
        return age >= 16;
      },
      message: 'User must be at least 16 years old'
    }
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    default: 'Not specified',
    enum: {
      values: [
        '10th',
        '12th',
        'Diploma',
        'B.E',
        'B.Tech',
        'B.Sc',
        'B.Com',
        'BBA',
        'BCA',
        'M.E',
        'M.Tech',
        'M.Sc',
        'M.Com',
        'MBA',
        'MCA',
        'PhD',
        'Others',
        'Not specified'
      ],
      message: 'Please select a valid qualification'
    }
  },
  customQualification: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom qualification cannot exceed 100 characters'],
    validate: {
      validator: function(this: IUserProfile, value: string) {
        if (this.qualification === 'Others' && !value) {
          return false;
        }
        return true;
      },
      message: 'Custom qualification is required when "Others" is selected'
    }
  },
  stream: {
    type: String,
    required: [true, 'Stream is required'],
    enum: {
      values: [
        'CSE',
        'IT',
        'ECE',
        'EEE',
        'ME',
        'CE',
        'Chemical',
        'Biotech',
        'Civil',
        'Mechanical',
        'Electrical',
        'Computer Science',
        'Information Technology',
        'Electronics',
        'Others'
      ],
      message: 'Please select a valid stream'
    }
  },
  customStream: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom stream cannot exceed 100 characters'],
    validate: {
      validator: function(this: IUserProfile, value: string) {
        if (this.stream === 'Others' && !value) {
          return false;
        }
        return true;
      },
      message: 'Custom stream is required when "Others" is selected'
    }
  },
  yearOfPassout: {
    type: Number,
    required: [true, 'Year of passout is required'],
    min: [2000, 'Year of passout must be 2000 or later'],
    max: [2030, 'Year of passout cannot be later than 2030']
  },
  cgpaOrPercentage: {
    type: Number,
    required: [true, 'CGPA or percentage is required'],
    min: [0, 'CGPA/Percentage cannot be negative'],
    max: [10, 'CGPA cannot exceed 10'],
    validate: {
      validator: function(this: IUserProfile, value: number) {
        // If qualification is 10th or 12th, percentage should be 0-100
        if (['10th', '12th'].includes(this.qualification)) {
          return value >= 0 && value <= 100;
        }
        // For other qualifications, CGPA should be 0-10
        return value >= 0 && value <= 10;
      },
      message: 'Invalid CGPA/Percentage value for the selected qualification'
    }
  },
  collegeName: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, 'College name cannot exceed 200 characters'],
    default: 'Not specified'
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  linkedinUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, 'Please enter a valid LinkedIn profile URL']
  },
  githubUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/, 'Please enter a valid GitHub profile URL']
  },
  resumeUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\.(pdf|doc|docx)$/i, 'Please enter a valid resume URL (PDF, DOC, or DOCX)']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save middleware to compute fullName
userProfileSchema.pre('save', function(next) {
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }
  next();
});

// Pre-update middleware to compute fullName on updates
userProfileSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.firstName || update.lastName) {
    // We need to fetch the current document to get both names
    this.findOne().then((doc: any) => {
      if (doc) {
        const firstName = update.firstName || doc.firstName;
        const lastName = update.lastName || doc.lastName;
        if (firstName && lastName) {
          update.fullName = `${firstName} ${lastName}`.trim();
        }
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Indexes for performance
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ fullName: 1 });
userProfileSchema.index({ qualification: 1 });
userProfileSchema.index({ stream: 1 });
userProfileSchema.index({ yearOfPassout: 1 });
userProfileSchema.index({ cgpaOrPercentage: 1 });
userProfileSchema.index({ collegeName: 1 });
userProfileSchema.index({ createdAt: -1 });

// Compound indexes for common queries
userProfileSchema.index({ qualification: 1, stream: 1, yearOfPassout: 1 });
userProfileSchema.index({ qualification: 1, stream: 1, cgpaOrPercentage: 1 });

// Pre-save middleware to validate custom fields
userProfileSchema.pre('save', function(next) {
  // Ensure custom fields are provided when "Others" is selected
  if (this.qualification === 'Others' && !this.customQualification) {
    return next(new Error('Custom qualification is required when "Others" is selected'));
  }
  
  if (this.stream === 'Others' && !this.customStream) {
    return next(new Error('Custom stream is required when "Others" is selected'));
  }
  
  next();
});

// Instance method to get full name
userProfileSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to get age
userProfileSchema.methods.getAge = function(): number {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Instance method to get qualification display name
userProfileSchema.methods.getQualificationDisplay = function(): string {
  if (this.qualification === 'Others' && this.customQualification) {
    return this.customQualification;
  }
  return this.qualification;
};

// Instance method to get stream display name
userProfileSchema.methods.getStreamDisplay = function(): string {
  if (this.stream === 'Others' && this.customStream) {
    return this.customStream;
  }
  return this.stream;
};

// Static method to find profiles by qualification and stream
userProfileSchema.statics.findByQualificationAndStream = function(qualification: string, stream: string) {
  return this.find({
    $or: [
      { qualification, stream },
      { qualification, customStream: stream },
      { customQualification: qualification, stream },
      { customQualification: qualification, customStream: stream }
    ]
  });
};

// Static method to find profiles by year range
userProfileSchema.statics.findByYearRange = function(startYear: number, endYear: number) {
  return this.find({
    yearOfPassout: { $gte: startYear, $lte: endYear }
  });
};

// Static method to find profiles by CGPA/Percentage range
userProfileSchema.statics.findByCGPARange = function(minValue: number, maxValue: number) {
  return this.find({
    cgpaOrPercentage: { $gte: minValue, $lte: maxValue }
  });
};

// Note: fullName is now a real field, not a virtual

// Virtual for age
userProfileSchema.virtual('age').get(function() {
  return (this as any).getAge();
});

// Virtual for qualification display
userProfileSchema.virtual('qualificationDisplay').get(function() {
  return (this as any).getQualificationDisplay();
});

// Virtual for stream display
userProfileSchema.virtual('streamDisplay').get(function() {
  return (this as any).getStreamDisplay();
});

// Ensure virtuals are serialized
userProfileSchema.set('toJSON', { virtuals: true });

// Create and export the model
export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);

// Export the schema for testing purposes
export { userProfileSchema };
