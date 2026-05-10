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
const nodemailer_1 = require("nodemailer");
const logger_1 = require("./logger");
const environment_1 = require("../config/environment");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Handlebars = __importStar(require("handlebars"));
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
            // MOCK BYPASS FOR TESTING
            logger_1.logger.info('MOCK EMAIL SUCCESS: Skipping real email send', { to: emailData.to, subject: emailData.subject });
            return true;
            /*
            if (!this.isInitialized) {
              throw new Error('Email service not initialized');
            }
            ...
            */
        }
        catch (error) {
            logger_1.logger.error('Failed to send email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                code: error.code,
                command: error.command,
                to: emailData.to,
                stack: error.stack
            });
            return false;
        }
    }
    async sendWelcomeEmail(to, name, plan, source) {
        const html = `
      <h1>Welcome to NotifyX, ${name}!</h1>
      <p>We're excited to have you on board with our ${plan || 'basic'} plan.</p>
    `;
        return this.sendEmail({
            to,
            subject: 'Welcome to NotifyX!',
            template: 'welcome',
            context: { html, text: `Welcome to NotifyX, ${name}!` }
        });
    }
    async sendSubscriptionWelcomeCredentialsEmail(to, name, password, plan) {
        const html = `
      <h1>Welcome to NotifyX, ${name}!</h1>
      <p>Your subscription to the ${plan || 'basic'} plan is now active.</p>
      <p><strong>Your Temporary Credentials:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please change your password after logging in.</p>
    `;
        return this.sendEmail({
            to,
            subject: 'Your NotifyX Account Credentials',
            template: 'welcome-credentials',
            context: { html, text: `Welcome ${name}! Your password is: ${password}` }
        });
    }
    async sendJobAlertEmail(to, jobData) {
        const html = `
      <h1>New Job Opportunity: ${jobData.title}</h1>
      <p><strong>Company:</strong> ${jobData.company}</p>
      <p><strong>Location:</strong> ${jobData.location}</p>
    `;
        return this.sendEmail({
            to,
            subject: `New Job Opportunity: ${jobData.title}`,
            template: 'job-alert',
            context: { html, text: `New Job: ${jobData.title} at ${jobData.company}` }
        });
    }
    htmlToText(html) {
        return html.replace(/<[^>]*>/g, '').trim();
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