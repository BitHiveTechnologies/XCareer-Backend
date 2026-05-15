export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export interface EmailData {
    to: string;
    subject: string;
    template?: string;
    context?: Record<string, any>;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
}
export declare enum EmailStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    DELIVERED = "delivered",
    BOUNCED = "bounced"
}
export declare class EmailService {
    private transporter;
    private templates;
    private isInitialized;
    constructor();
    /**
     * Load email templates from templates directory
     */
    private loadTemplates;
    private initializeTransporter;
    sendEmail(emailData: EmailData): Promise<boolean>;
    sendWelcomeEmail(to: string, name: string, plan?: string, source?: string): Promise<boolean>;
    sendSubscriptionWelcomeCredentialsEmail(to: string, name: string, password?: string, plan?: string): Promise<boolean>;
    sendSubscriptionUpgradeEmail(to: string, name: string, plan: string, features: string[]): Promise<boolean>;
    sendSubscriptionExpiryEmail(to: string, name: string, plan: string, daysLeft: number): Promise<boolean>;
    sendJobAlertEmail(to: string, jobData: {
        userName?: string;
        jobTitle: string;
        companyName: string;
        location: string;
        jobType?: string;
        description?: string;
        applicationLink?: string;
        matchScore?: number;
        salary?: string;
        stipend?: string;
        applicationDeadline?: string;
    }): Promise<boolean>;
    /**
     * Send a single email containing multiple job matches (Aggregated)
     */
    sendAggregatedJobAlertEmail(to: string, data: {
        name: string;
        jobCount: number;
        jobs: Array<{
            title: string;
            company: string;
            location: string;
            type: string;
            matchPercentage: number;
            description: string;
            applicationLink: string;
            salary?: string;
        }>;
        dashboardUrl: string;
    }): Promise<boolean>;
    sendPasswordChangedEmail(to: string, name: string): Promise<boolean>;
    private htmlToText;
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map