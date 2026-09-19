import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
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
  
  // JWT configuration (core authentication)
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h', // 24 hours for testing
  JWT_EXPIRE: process.env['JWT_EXPIRE'] || '7d',
  JWT_REFRESH_EXPIRE: process.env['JWT_REFRESH_EXPIRE'] || '30d',
  
  // Frontend URL for CORS
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  
  // Email configuration (Resend HTTP API — Railway blocks outbound SMTP ports)
  RESEND_API_KEY: process.env['RESEND_API_KEY'] || '',
  EMAIL_FROM: process.env['EMAIL_FROM'] || '',
  
  // Cashfree configuration
  CASHFREE_CLIENT_ID: process.env['CASHFREE_CLIENT_ID'] || '',
  CASHFREE_CLIENT_SECRET: process.env['CASHFREE_CLIENT_SECRET'] || '',
  CASHFREE_WEBHOOK_SECRET: process.env['CASHFREE_WEBHOOK_SECRET'] || '',
  CASHFREE_ENV: process.env['CASHFREE_ENV'] || 'sandbox',
  CASHFREE_API_VERSION: process.env['CASHFREE_API_VERSION'] || '2023-08-01',
  
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
export const validateEnvironment = (): void => {
  // Only what the service genuinely cannot run without. The CLERK_* vars are
  // deliberately absent: production has never had them, so requiring them here
  // would crash a currently-working deployment.
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CASHFREE_CLIENT_ID',
    'CASHFREE_CLIENT_SECRET',
    'CASHFREE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && config.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed in production environment');
  }
};
