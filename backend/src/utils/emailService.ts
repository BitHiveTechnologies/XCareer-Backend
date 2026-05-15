import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { logger } from './logger';
import { config } from '../config/environment';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

// Email template interface
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email data interface
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

// Email delivery status
export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced'
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate>;
  private isInitialized: boolean = false;

  constructor() {
    this.templates = new Map();
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Load email templates from templates directory
   */
  private loadTemplates(): void {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      if (!fs.existsSync(templatesDir)) {
        logger.info('Email templates directory not found, using default templates');
        return;
      }

      const templateFiles = fs.readdirSync(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          
          this.templates.set(templateName, Handlebars.compile(templateContent));
          logger.info(`Loaded email template: ${templateName}`);
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private initializeTransporter(): void {
    try {
      // Check if email configuration is provided
      if (!config.EMAIL_HOST || !config.EMAIL_PORT || !config.EMAIL_USER || !config.EMAIL_PASS) {
        logger.warn('Email configuration incomplete, using test mode');
        // Use Ethereal for testing when credentials are not configured
        this.transporter = createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'test@ethereal.email',
            pass: 'test123'
          }
        });
        logger.info('Email transporter initialized in test mode (Ethereal)');
      } else {
        // Use configured SMTP settings
        this.transporter = createTransport({
          host: config.EMAIL_HOST,
          port: parseInt(config.EMAIL_PORT.toString()),
          secure: parseInt(config.EMAIL_PORT.toString()) === 465,
          auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
          }
        });
        logger.info('Email transporter initialized with configured SMTP settings', {
          host: config.EMAIL_HOST,
          port: config.EMAIL_PORT,
          user: config.EMAIL_USER
        });
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize email transporter', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.isInitialized = false;
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      let html = emailData.html;
      let text = emailData.text;

      // If template is provided, render it
      if (emailData.template) {
        const templateDelegate = this.templates.get(emailData.template);
        if (templateDelegate) {
          html = templateDelegate({
            ...emailData.context,
            frontendUrl: config.FRONTEND_URL
          });
        } else {
          logger.warn(`Template ${emailData.template} not found, falling back to direct html/text`);
        }
      }

      if (!html) {
        throw new Error('Email HTML content is missing');
      }

      // Generate text fallback if not provided
      if (!text) {
        text = this.htmlToText(html);
      }

      const info = await this.transporter.sendMail({
        from: `"XCareer Support" <${config.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: text,
        html: html,
        attachments: emailData.attachments
      });

      logger.info('Email sent successfully', { messageId: info.messageId, to: emailData.to });
      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to,
        subject: emailData.subject
      });
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string, plan?: string, source?: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to NotifyX!',
      template: 'welcome',
      context: { 
        name, 
        plan: plan || 'basic', 
        source,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  async sendSubscriptionWelcomeCredentialsEmail(to: string, name: string, password?: string, plan?: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Your NotifyX Account Credentials',
      template: 'login-credentials',
      context: { 
        name,
        email: to,
        password,
        plan: plan || 'basic',
        loginUrl: `${config.FRONTEND_URL}/login`,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  async sendSubscriptionUpgradeEmail(to: string, name: string, plan: string, features: string[]): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Your Upgrade to NotifyX ${plan.charAt(0).toUpperCase() + plan.slice(1)} is Complete!`,
      template: 'subscription-upgrade',
      context: {
        name,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        features,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  async sendSubscriptionExpiryEmail(to: string, name: string, plan: string, daysLeft: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Your NotifyX ${plan} Subscription is Expiring Soon`,
      template: 'subscription-expiry',
      context: {
        name,
        plan,
        daysLeft,
        renewalUrl: `${config.FRONTEND_URL}/pricing`,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  async sendJobAlertEmail(to: string, jobData: {
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
  }): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `🚀 New Job Opportunity: ${jobData.jobTitle} at ${jobData.companyName}`,
      template: 'job-alert',
      context: {
        ...jobData,
        userName: jobData.userName || 'there',
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  /**
   * Send a single email containing multiple job matches (Aggregated)
   */
  async sendAggregatedJobAlertEmail(to: string, data: {
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
  }): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `🚀 ${data.jobCount} New Job Matches Found for You!`,
      template: 'bulk-job-alert',
      context: {
        ...data,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  async sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Security Alert: Your NotifyX Password Has Been Changed',
      template: 'password-changed',
      context: { 
        name,
        frontendUrl: config.FRONTEND_URL
      }
    });
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const emailService = new EmailService();
