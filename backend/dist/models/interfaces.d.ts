import { Document, ObjectId } from 'mongoose';
export interface BaseDocument extends Document {
    createdAt: Date;
    updatedAt: Date;
}
export interface IUser extends BaseDocument {
    _id: ObjectId;
    clerkUserId?: string;
    email: string;
    password?: string;
    name: string;
    mobile: string;
    role: 'user' | 'admin' | 'super_admin';
    subscriptionPlan: 'basic' | 'premium';
    subscriptionStatus: 'active' | 'inactive' | 'expired';
    subscriptionStartDate: Date;
    subscriptionEndDate: Date;
    isProfileComplete: boolean;
}
export interface IUserProfile extends BaseDocument {
    _id: ObjectId;
    userId: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    dateOfBirth: Date;
    qualification: string;
    customQualification?: string;
    stream: string;
    customStream?: string;
    yearOfPassout: number;
    cgpaOrPercentage: number;
    collegeName: string;
}
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
    postedBy: ObjectId;
    applications?: ObjectId[];
}
export interface IJobNotification extends BaseDocument {
    _id: ObjectId;
    jobId: ObjectId;
    userId: ObjectId;
    emailSent: boolean;
    emailSentAt?: Date;
    emailStatus: 'pending' | 'sent' | 'failed';
}
export interface IAdmin extends BaseDocument {
    _id: ObjectId;
    email: string;
    password: string;
    name: string;
    role: 'super_admin' | 'admin';
    permissions: string[];
    isActive: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
    addPermission(permission: string): boolean;
    removePermission(permission: string): boolean;
    getRoleDisplay(): string;
}
export interface ISubscription extends BaseDocument {
    _id: ObjectId;
    userId: ObjectId;
    plan: 'basic' | 'premium';
    amount: number;
    paymentId: string;
    orderId: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
    startDate: Date;
    endDate: Date;
}
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
export interface IEmailTemplate extends BaseDocument {
    _id: ObjectId;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
    isActive: boolean;
}
export interface ISystemSettings extends BaseDocument {
    _id: ObjectId;
    key: string;
    value: any;
    description: string;
    category: 'general' | 'email' | 'payment' | 'security';
}
//# sourceMappingURL=interfaces.d.ts.map