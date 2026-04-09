import { Document, ObjectId } from 'mongoose';

// Base interface for all documents
export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// User interface
export interface IUser extends BaseDocument {
  _id: ObjectId;
  clerkUserId?: string; // Clerk user ID for external auth
  email: string; // Unique, serves as username
  password?: string; // Hashed - optional when using Clerk
  // Personal information (name, mobile) is now stored in UserProfile model
  role: 'user' | 'admin' | 'super_admin'; // User role for access control
  subscriptionPlan: 'basic' | 'premium'; // ₹49 or ₹99
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  isProfileComplete: boolean;
}

// User Profile interface
export interface IUserProfile extends BaseDocument {
  _id: ObjectId;
  userId: ObjectId; // Reference to Users
  firstName: string;
  lastName: string;
  fullName: string; // Computed field: firstName + lastName
  contactNumber: string; // Mobile number
  dateOfBirth: Date;
  qualification: string; // B.E, B.Tech, M.Tech, etc.
  customQualification?: string; // If "Others" selected
  stream: string; // CSE, IT, ECE, etc.
  customStream?: string; // If "Others" selected
  yearOfPassout: number; // 2023-2029
  cgpaOrPercentage: number;
  collegeName: string;
  skills?: string[]; // Array of skills
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
}

// Job interface
export interface IJob extends BaseDocument {
  _id: ObjectId;
  title: string;
  company: string;
  description: string;
  type: 'job' | 'internship';
  eligibility: {
    qualifications: string[];
    streams: string[];
    passoutYears: number[];
    minCGPA?: number;
  };
  applicationDeadline: Date;
  applicationLink: string;
  location: 'remote' | 'onsite' | 'hybrid';
  salary?: string;
  stipend?: string;
  isActive: boolean;
  postedBy: ObjectId; // Admin user ID
  applications?: ObjectId[]; // Job applications
}

// Job Notification interface
export interface IJobNotification extends BaseDocument {
  _id: ObjectId;
  jobId: ObjectId;
  userId: ObjectId;
  emailSent: boolean;
  emailSentAt?: Date;
  emailStatus: 'pending' | 'sent' | 'failed';
}

// Admin interface
export interface IAdmin extends BaseDocument {
  _id: ObjectId;
  email: string;
  password: string; // Hashed
  name: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  isActive: boolean;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;
  addPermission(permission: string): boolean;
  removePermission(permission: string): boolean;
  getRoleDisplay(): string;
}

// Subscription interface
export interface ISubscription extends BaseDocument {
  _id: ObjectId;
  userId: ObjectId;
  plan: 'basic' | 'premium' | 'enterprise';
  amount: number;
  provider?: 'cashfree';
  paymentId?: string; // Cashfree payment ID (cf_payment_id)
  orderId: string; // Cashfree order ID
  paymentSessionId?: string;
  paymentStatus?: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED' | 'REFUNDED' | 'CANCELLED';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date; // For recurring subscriptions
  autoRenew: boolean; // Auto-renewal setting
  trialEndDate?: Date; // For trial subscriptions
  cancellationDate?: Date; // When subscription was cancelled
  cancellationReason?: string; // Reason for cancellation
  metadata?: {
    source?: string; // How the subscription was created (web, mobile, admin)
    campaign?: string; // Marketing campaign that led to subscription
    referrer?: string; // Referral source
    notes?: string; // Admin notes
  };
}

// Job Application interface (additional for future use)
export interface IJobApplication extends BaseDocument {
  _id: ObjectId;
  jobId: ObjectId;
  userId: ObjectId;
  status: 'applied' | 'shortlisted' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  resumeUrl?: string;
  coverLetter?: string;
  adminNotes?: string;
}

// Email Template interface
export interface IEmailTemplate extends BaseDocument {
  _id: ObjectId;
  name: string; // welcome, job-alert, password-reset, etc.
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Array of variable names used in template
  isActive: boolean;
}

// System Settings interface
export interface ISystemSettings extends BaseDocument {
  _id: ObjectId;
  key: string;
  value: any;
  description: string;
  category: 'general' | 'email' | 'payment' | 'security';
}

// Notification interface
export interface INotification extends BaseDocument {
  _id: ObjectId;
  userId: ObjectId;
  type: 'job_alert' | 'subscription' | 'payment' | 'system' | 'profile' | 'application';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
