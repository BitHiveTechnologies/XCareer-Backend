import { config } from './environment';

export const clerkConfig = {
  secretKey: config.CLERK_SECRET_KEY,
  publishableKey: config.CLERK_PUBLISHABLE_KEY,
  jwtKey: config.CLERK_JWT_KEY,
  webhookSecret: config.CLERK_WEBHOOK_SECRET,
  apiUrl: config.CLERK_API_URL || 'https://api.clerk.com',
  frontendApi: config.CLERK_FRONTEND_API || 'https://clerk.your-domain.com'
};

export const clerkWebhookEvents = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  SESSION_CREATED: 'session.created',
  SESSION_ENDED: 'session.ended',
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted'
};
