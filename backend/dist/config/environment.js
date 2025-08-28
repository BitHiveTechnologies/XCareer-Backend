"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.config = {
    // Server configuration
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    PORT: parseInt(process.env['PORT'] || '5000', 10),
    // Database configuration
    MONGODB_URI: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/notifyx',
    // Clerk configuration
    CLERK_SECRET_KEY: process.env['CLERK_SECRET_KEY'] || '',
    CLERK_PUBLISHABLE_KEY: process.env['CLERK_PUBLISHABLE_KEY'] || '',
    CLERK_JWT_KEY: process.env['CLERK_JWT_KEY'] || '',
    CLERK_WEBHOOK_SECRET: process.env['CLERK_WEBHOOK_SECRET'] || '',
    CLERK_API_URL: process.env['CLERK_API_URL'] || 'https://api.clerk.com',
    CLERK_FRONTEND_API: process.env['CLERK_FRONTEND_API'] || '',
    // JWT configuration (legacy - will be removed after Clerk migration)
    JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
    JWT_EXPIRE: process.env['JWT_EXPIRE'] || '7d',
    JWT_REFRESH_EXPIRE: process.env['JWT_REFRESH_EXPIRE'] || '30d',
    // Frontend URL for CORS
    FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    // Email configuration
    EMAIL_HOST: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env['EMAIL_PORT'] || '587', 10),
    EMAIL_USER: process.env['EMAIL_USER'] || '',
    EMAIL_PASS: process.env['EMAIL_PASS'] || '',
    // Razorpay configuration
    RAZORPAY_KEY_ID: process.env['RAZORPAY_KEY_ID'] || '',
    RAZORPAY_KEY_SECRET: process.env['RAZORPAY_KEY_SECRET'] || '',
    RAZORPAY_WEBHOOK_SECRET: process.env['RAZORPAY_WEBHOOK_SECRET'] || '',
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
    // Logging
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
    // Security
    BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
    // File upload
    MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '5242880', 10), // 5MB
    UPLOAD_PATH: process.env['UPLOAD_PATH'] || 'uploads/'
};
// Validate required environment variables
const validateEnvironment = () => {
    const requiredVars = [
        'CLERK_SECRET_KEY',
        'CLERK_PUBLISHABLE_KEY',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'EMAIL_USER',
        'EMAIL_PASS'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0 && exports.config.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    if (exports.config.NODE_ENV === 'production' && exports.config.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        throw new Error('JWT_SECRET must be changed in production environment');
    }
};
exports.validateEnvironment = validateEnvironment;
//# sourceMappingURL=environment.js.map