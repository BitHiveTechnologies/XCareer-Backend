"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = exports.EmailStatus = void 0;
const fs = __importStar(require("fs"));
const Handlebars = __importStar(require("handlebars"));
const nodemailer_1 = require("nodemailer");
const path = __importStar(require("path"));
const environment_1 = require("../config/environment");
const logger_1 = require("./logger");
// Email delivery status
var EmailStatus;
(function (EmailStatus) {
    EmailStatus["PENDING"] = "pending";
    EmailStatus["SENT"] = "sent";
    EmailStatus["FAILED"] = "failed";
    EmailStatus["DELIVERED"] = "delivered";
    EmailStatus["BOUNCED"] = "bounced";
})(EmailStatus || (exports.EmailStatus = EmailStatus = {}));
// Email service class
class EmailService {
    constructor() {
        this.isInitialized = false;
        this.templates = new Map();
        this.initializeTransporter();
        this.loadTemplates();
    }
    /**
     * Load email templates from templates directory
     */
    loadTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/emails');
            if (!fs.existsSync(templatesDir)) {
                logger_1.logger.info('Email templates directory not found, using default templates');
                return;
            }
            const templateFiles = fs.readdirSync(templatesDir);
            for (const file of templateFiles) {
                if (file.endsWith('.hbs')) {
                    const templateName = path.basename(file, '.hbs');
                    const templatePath = path.join(templatesDir, file);
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    this.templates.set(templateName, Handlebars.compile(templateContent));
                    logger_1.logger.info(`Loaded email template: ${templateName}`);
                }
            }
            logger_1.logger.info(`Loaded ${this.templates.size} email templates`);
        }
        catch (error) {
            logger_1.logger.error('Failed to load email templates', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    initializeTransporter() {
        try {
            // Check if email configuration is provided
            if (!environment_1.config.EMAIL_HOST || !environment_1.config.EMAIL_PORT || !environment_1.config.EMAIL_USER || !environment_1.config.EMAIL_PASS) {
                logger_1.logger.warn('Email configuration incomplete, using test mode');
                // Use Ethereal for testing when credentials are not configured
                this.transporter = (0, nodemailer_1.createTransport)({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'test@ethereal.email',
                        pass: 'test123'
                    }
                });
                logger_1.logger.info('Email transporter initialized in test mode (Ethereal)');
            }
            else {
                // Use configured SMTP settings
                this.transporter = (0, nodemailer_1.createTransport)({
                    host: environment_1.config.EMAIL_HOST,
                    port: parseInt(environment_1.config.EMAIL_PORT.toString()),
                    secure: parseInt(environment_1.config.EMAIL_PORT.toString()) === 465,
                    auth: {
                        user: environment_1.config.EMAIL_USER,
                        pass: environment_1.config.EMAIL_PASS
                    }
                });
                logger_1.logger.info('Email transporter initialized with configured SMTP settings', {
                    host: environment_1.config.EMAIL_HOST,
                    port: environment_1.config.EMAIL_PORT,
                    user: environment_1.config.EMAIL_USER
                });
            }
            this.isInitialized = true;
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email transporter', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.isInitialized = false;
        }
    }
    async sendEmail(emailData) {
        try {
            if (!this.isInitialized) {
                throw new Error('Email service not initialized');
            }
            const mailOptions = {
                from: `"NotifyX" <${environment_1.config.EMAIL_USER}>`,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.context.html || emailData.context.text,
                text: emailData.context.text || this.htmlToText(emailData.context.html)
            };
            const result = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info('Email sent successfully', {
                messageId: result.messageId,
                to: emailData.to,
                template: emailData.template
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to: emailData.to
            });
            return false;
        }
    }
    async sendWelcomeEmail(to, name, plan, source) {
        try {
            // Get template if available
            const template = this.templates.get('welcome');
            if (template) {
                // Use Handlebars template
                const html = template({
                    name,
                    plan: plan || 'Basic',
                    source: source || 'direct',
                    frontendUrl: environment_1.config.FRONTEND_URL || 'http://localhost:3000',
                    features: this.getPlanFeatures(plan || 'basic'),
                    supportEmail: environment_1.config.SUPPORT_EMAIL || 'support@notifyx.com'
                });
                return this.sendEmail({
                    to,
                    subject: `Welcome to NotifyX, ${name}! 🎉`,
                    template: 'welcome',
                    context: {
                        html,
                        text: `Welcome to NotifyX, ${name}! We're excited to have you on board. Complete your profile to get started with personalized job recommendations.`
                    }
                });
            }
            else {
                // Fallback to simple HTML
                const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">🎉 Welcome to NotifyX, ${name}!</h1>
            <p>We're thrilled to have you join our community of job seekers and career builders!</p>
            <p><strong>Your Plan:</strong> ${plan || 'Basic'}</p>
            <p>With NotifyX, you can:</p>
            <ul>
              <li>Discover personalized job recommendations</li>
              <li>Track your application progress</li>
              <li>Get notified about new opportunities</li>
              <li>Build your professional profile</li>
            </ul>
            <p>Ready to get started? Complete your profile to receive personalized job recommendations!</p>
            <p>Best regards,<br><strong>The NotifyX Team</strong></p>
          </div>
        `;
                return this.sendEmail({
                    to,
                    subject: `Welcome to NotifyX, ${name}! 🎉`,
                    template: 'welcome',
                    context: {
                        html,
                        text: `Welcome to NotifyX, ${name}! We're excited to have you on board. Complete your profile to get started with personalized job recommendations.`
                    }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send welcome email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to,
                name
            });
            return false;
        }
    }
    async sendJobAlertEmail(to, jobData) {
        try {
            // Use enhanced template if match percentage is available
            const templateName = jobData.matchPercentage ? 'enhanced-job-alert' : 'job-alert';
            const template = this.templates.get(templateName);
            if (!template) {
                logger_1.logger.error(`Job alert template not found: ${templateName}`);
                // Fallback to basic template
                const fallbackTemplate = this.templates.get('job-alert');
                if (!fallbackTemplate) {
                    logger_1.logger.error('No job alert templates available');
                    return false;
                }
            }
            // Prepare context data for the template
            const context = {
                // Basic job data
                jobTitle: jobData.title,
                title: jobData.title,
                companyName: jobData.company,
                company: jobData.company,
                location: jobData.location,
                jobType: jobData.type,
                type: jobData.type,
                description: jobData.description,
                applicationLink: jobData.applicationLink,
                // Enhanced matching data
                matchPercentage: jobData.matchPercentage,
                matchReasons: jobData.matchReasons,
                userProfile: jobData.userProfile || {}
            };
            const html = template(context);
            // Enhanced subject line with match percentage
            const subject = jobData.matchPercentage
                ? `🎯 ${jobData.matchPercentage}% Match: ${jobData.title} at ${jobData.company}`
                : `New Job Opportunity: ${jobData.title}`;
            return this.sendEmail({
                to,
                subject,
                template: templateName,
                context: {
                    html,
                    text: `New Job: ${jobData.title} at ${jobData.company} - ${jobData.location}${jobData.matchPercentage ? ` (${jobData.matchPercentage}% match)` : ''}`
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Send job alert email failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to,
                jobTitle: jobData.title
            });
            return false;
        }
    }
    /**
     * Send subscription upgrade email
     */
    async sendSubscriptionUpgradeEmail(to, name, plan, newFeatures) {
        try {
            const template = this.templates.get('subscription-upgrade');
            if (template) {
                const html = template({
                    name,
                    plan,
                    newFeatures,
                    features: this.getPlanFeatures(plan),
                    frontendUrl: environment_1.config.FRONTEND_URL || 'http://localhost:3000',
                    supportEmail: environment_1.config.SUPPORT_EMAIL || 'support@notifyx.com'
                });
                return this.sendEmail({
                    to,
                    subject: `🎉 Subscription Upgraded to ${plan}!`,
                    template: 'subscription-upgrade',
                    context: {
                        html,
                        text: `Congratulations ${name}! Your subscription has been upgraded to ${plan}. You now have access to new features and benefits.`
                    }
                });
            }
            else {
                // Fallback
                const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10B981;">🎉 Subscription Upgraded!</h1>
            <p>Congratulations ${name}! Your subscription has been upgraded to <strong>${plan}</strong>!</p>
            <p>You now have access to new features and benefits.</p>
          </div>
        `;
                return this.sendEmail({
                    to,
                    subject: `🎉 Subscription Upgraded to ${plan}!`,
                    template: 'subscription-upgrade',
                    context: { html, text: `Congratulations ${name}! Your subscription has been upgraded to ${plan}.` }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send subscription upgrade email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to,
                name,
                plan
            });
            return false;
        }
    }
    /**
     * Send subscription expiry reminder email
     */
    async sendSubscriptionExpiryEmail(to, name, plan, daysRemaining) {
        try {
            const template = this.templates.get('subscription-expiry');
            if (template) {
                const html = template({
                    name,
                    plan,
                    daysRemaining,
                    features: this.getPlanFeatures(plan),
                    frontendUrl: environment_1.config.FRONTEND_URL || 'http://localhost:3000',
                    supportEmail: environment_1.config.SUPPORT_EMAIL || 'support@notifyx.com'
                });
                return this.sendEmail({
                    to,
                    subject: `⏰ Your ${plan} subscription expires in ${daysRemaining} days`,
                    template: 'subscription-expiry',
                    context: {
                        html,
                        text: `Hello ${name}! Your ${plan} subscription will expire in ${daysRemaining} days. Please renew to continue enjoying all the benefits.`
                    }
                });
            }
            else {
                // Fallback
                const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F59E0B;">⏰ Subscription Expiring Soon</h1>
            <p>Hello ${name}! Your <strong>${plan}</strong> subscription will expire in ${daysRemaining} days.</p>
            <p>Please renew your subscription to continue enjoying all the benefits.</p>
          </div>
        `;
                return this.sendEmail({
                    to,
                    subject: `⏰ Your ${plan} subscription expires in ${daysRemaining} days`,
                    template: 'subscription-expiry',
                    context: { html, text: `Hello ${name}! Your ${plan} subscription will expire in ${daysRemaining} days.` }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send subscription expiry email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to,
                name,
                plan,
                daysRemaining
            });
            return false;
        }
    }
    htmlToText(html) {
        return html.replace(/<[^>]*>/g, '').trim();
    }
    /**
     * Get plan features for email templates
     */
    getPlanFeatures(plan) {
        const features = {
            basic: [
                'Personalized job recommendations',
                'Basic profile management',
                'Email notifications',
                'Application tracking'
            ],
            premium: [
                'Advanced job matching',
                'Priority support',
                'Resume optimization tips',
                'Interview preparation',
                'Career insights',
                'Unlimited applications'
            ],
            enterprise: [
                'Everything in Premium',
                'Dedicated career coach',
                'Custom job alerts',
                'Advanced analytics',
                'Priority placement',
                'White-glove service'
            ]
        };
        return features[plan.toLowerCase()] || features.basic;
    }
    async verifyConnection() {
        try {
            if (!this.isInitialized)
                return false;
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map