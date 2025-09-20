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
  template: string;
  context: Record<string, any>;
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

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"NotifyX" <${config.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.context.html || emailData.context.text,
        text: emailData.context.text || this.htmlToText(emailData.context.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: emailData.to,
        template: emailData.template
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to
      });
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = `
      <h1>Welcome to NotifyX, ${name}!</h1>
      <p>We're excited to have you on board.</p>
    `;
    
    return this.sendEmail({
      to,
      subject: 'Welcome to NotifyX!',
      template: 'welcome',
      context: { html, text: `Welcome to NotifyX, ${name}!` }
    });
  }

  async sendJobAlertEmail(to: string, jobData: any): Promise<boolean> {
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
