import crypto from 'crypto';
import { User } from '../models/User';
import { emailService } from './emailService';
import { logger } from './logger';

/**
 * Generate a random password
 */
export const generateRandomPassword = (length: number = 10): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Auto-create a user if they don't exist and send credentials
 */
export const autoCreateUserAndSendCredentials = async (email: string, name?: string): Promise<any> => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      logger.info('User already exists, skipping auto-creation', { email });
      return { user, isNew: false };
    }

    const password = generateRandomPassword();
    const displayName = name || email.split('@')[0];

    // Create new user
    user = new User({
      email,
      name: displayName,
      password, // In a real app, this should be hashed. Assuming User model hashes it or we use a hashing util.
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'active', // Since this is called on successful subscription
      subscriptionPlan: 'premium'
    });

    await user.save();

    // Send credentials via email
    await emailService.sendEmail({
      to: email,
      subject: 'Your NotifyX Account Credentials',
      template: 'credentials',
      context: {
        html: `
          <h1>Welcome to NotifyX!</h1>
          <p>An account has been created for you following your subscription.</p>
          <p><strong>Username/Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please login and change your password as soon as possible.</p>
          <a href="${process.env.FRONTEND_URL}/login">Login Now</a>
        `,
        text: `Welcome to NotifyX! Your account credentials: Email: ${email}, Password: ${password}. Login at ${process.env.FRONTEND_URL}/login`
      }
    });

    logger.info('Auto-created user and sent credentials', { email });

    return { user, isNew: true, password };
  } catch (error) {
    logger.error('Auto-create user failed', { error, email });
    throw error;
  }
};
