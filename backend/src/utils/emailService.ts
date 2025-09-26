import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import nodemailer, { createTransport } from 'nodemailer';
import * as path from 'path';
import { config } from '../config/environment';
import { logger } from './logger';

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

  async sendWelcomeEmail(to: string, name: string, plan?: string, source?: string): Promise<boolean> {
    try {
      // Get template if available
      const template = this.templates.get('welcome');
      
      if (template) {
        // Use Handlebars template
        const html = template({
          name,
          plan: plan || 'Basic',
          source: source || 'direct',
          frontendUrl: config.FRONTEND_URL || 'http://localhost:3000',
          features: this.getPlanFeatures(plan || 'basic'),
          supportEmail: config.SUPPORT_EMAIL || 'support@notifyx.com'
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
      } else {
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
    } catch (error) {
      logger.error('Failed to send welcome email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
        name
      });
      return false;
    }
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

  /**
   * Send subscription upgrade email
   */
  async sendSubscriptionUpgradeEmail(to: string, name: string, plan: string, newFeatures: string[]): Promise<boolean> {
    try {
      const template = this.templates.get('subscription-upgrade');
      
      if (template) {
        const html = template({
          name,
          plan,
          newFeatures,
          features: this.getPlanFeatures(plan),
          frontendUrl: config.FRONTEND_URL || 'http://localhost:3000',
          supportEmail: config.SUPPORT_EMAIL || 'support@notifyx.com'
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
      } else {
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
    } catch (error) {
      logger.error('Failed to send subscription upgrade email', {
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
  async sendSubscriptionExpiryEmail(to: string, name: string, plan: string, daysRemaining: number): Promise<boolean> {
    try {
      const template = this.templates.get('subscription-expiry');
      
      if (template) {
        const html = template({
          name,
          plan,
          daysRemaining,
          features: this.getPlanFeatures(plan),
          frontendUrl: config.FRONTEND_URL || 'http://localhost:3000',
          supportEmail: config.SUPPORT_EMAIL || 'support@notifyx.com'
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
      } else {
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
    } catch (error) {
      logger.error('Failed to send subscription expiry email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
        name,
        plan,
        daysRemaining
      });
      return false;
    }
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Get plan features for email templates
   */
  private getPlanFeatures(plan: string): string[] {
    const features: Record<string, string[]> = {
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
