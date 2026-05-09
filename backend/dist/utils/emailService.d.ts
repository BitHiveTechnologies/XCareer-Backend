export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export interface EmailData {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
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
    sendWelcomeEmail(to: string, name: string): Promise<boolean>;
    sendJobAlertEmail(to: string, jobData: any): Promise<boolean>;
    private htmlToText;
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map