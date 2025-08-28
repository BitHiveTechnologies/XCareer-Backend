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
  name: string;
  mobile: string;
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
  email: string;
  contactNumber: string;
  dateOfBirth: Date;
  qualification: string; // B.E, B.Tech, M.Tech, etc.
  customQualification?: string; // If "Others" selected
  stream: string; // CSE, IT, ECE, etc.
  customStream?: string; // If "Others" selected
  yearOfPassout: number; // 2023-2029
  cgpaOrPercentage: number;
  collegeName: string;
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
}

// Subscription interface
export interface ISubscription extends BaseDocument {
  _id: ObjectId;
  userId: ObjectId;
  plan: 'basic' | 'premium';
  amount: number;
  paymentId: string; // Razorpay payment ID
  orderId: string; // Razorpay order ID
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
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
