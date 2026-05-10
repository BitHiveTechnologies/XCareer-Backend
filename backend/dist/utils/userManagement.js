"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoCreateUserAndSendCredentials = exports.generateRandomPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const emailService_1 = require("./emailService");
const logger_1 = require("./logger");
/**
 * Generate a random password
 */
const generateRandomPassword = (length = 10) => {
    return crypto_1.default.randomBytes(length).toString('hex').slice(0, length);
};
exports.generateRandomPassword = generateRandomPassword;
/**
 * Auto-create a user if they don't exist and send credentials
 */
const autoCreateUserAndSendCredentials = async (email, name) => {
    try {
        // Check if user already exists
        let user = await User_1.User.findOne({ email });
        if (user) {
            logger_1.logger.info('User already exists, skipping auto-creation', { email });
            return { user, isNew: false };
        }
        const password = (0, exports.generateRandomPassword)();
        const displayName = name || email.split('@')[0];
        // Create new user
        user = new User_1.User({
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
        await emailService_1.emailService.sendEmail({
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
        logger_1.logger.info('Auto-created user and sent credentials', { email });
        return { user, isNew: true, password };
    }
    catch (error) {
        logger_1.logger.error('Auto-create user failed', { error, email });
        throw error;
    }
};
exports.autoCreateUserAndSendCredentials = autoCreateUserAndSendCredentials;
//# sourceMappingURL=userManagement.js.map