export interface UserProvisioningData {
    email: string;
    name: string;
    mobile?: string;
    clerkUserId?: string;
    subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
    subscriptionStatus?: 'active' | 'inactive' | 'expired';
    profileData?: {
        firstName?: string;
        lastName?: string;
        qualification?: string;
        stream?: string;
        yearOfPassout?: number;
        cgpaOrPercentage?: number;
        collegeName?: string;
        dateOfBirth?: Date;
    };
    metadata?: {
        source?: string;
        campaign?: string;
        referrer?: string;
        notes?: string;
    };
}
export interface ProvisioningResult {
    success: boolean;
    user?: any;
    profile?: any;
    subscription?: any;
    errors?: string[];
    warnings?: string[];
}
/**
 * Comprehensive User Provisioning Service
 * Handles automated user creation, profile setup, and subscription management
 */
export declare class UserProvisioningService {
    /**
     * Provision a new user with complete setup
     */
    static provisionUser(data: UserProvisioningData): Promise<ProvisioningResult>;
    /**
     * Create a new user
     */
    private static createUser;
    /**
     * Create user profile
     */
    private static createUserProfile;
    /**
     * Create subscription
     */
    private static createSubscription;
    /**
     * Update existing user
     */
    private static updateExistingUser;
    /**
     * Trigger welcome email
     */
    private static triggerWelcomeEmail;
    /**
     * Get plan amount
     */
    private static getPlanAmount;
    /**
     * Get plan features
     */
    private static getPlanFeatures;
    /**
     * Provision user from payment webhook
     */
    static provisionFromPaymentWebhook(paymentData: any): Promise<ProvisioningResult>;
    /**
     * Determine plan from payment amount
     */
    private static determinePlanFromAmount;
    /**
     * Bulk provision users
     */
    static bulkProvisionUsers(usersData: UserProvisioningData[]): Promise<ProvisioningResult[]>;
    /**
     * Get provisioning statistics
     */
    static getProvisioningStats(): Promise<any>;
}
//# sourceMappingURL=userProvisioningService.d.ts.map