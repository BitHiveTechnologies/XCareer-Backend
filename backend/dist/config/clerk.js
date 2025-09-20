"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clerkWebhookEvents = exports.clerkConfig = void 0;
const environment_1 = require("./environment");
exports.clerkConfig = {
    secretKey: environment_1.config.CLERK_SECRET_KEY,
    publishableKey: environment_1.config.CLERK_PUBLISHABLE_KEY,
    jwtKey: environment_1.config.CLERK_JWT_KEY,
    webhookSecret: environment_1.config.CLERK_WEBHOOK_SECRET,
    apiUrl: environment_1.config.CLERK_API_URL || 'https://api.clerk.com',
    frontendApi: environment_1.config.CLERK_FRONTEND_API || 'https://clerk.your-domain.com',
    // Session configuration for longer token lifespan
    sessionTokenTemplate: {
        name: 'default',
        lifetimeInSeconds: 3600, // 1 hour
        audience: ['http://localhost:8080', 'http://localhost:3000']
    }
};
exports.clerkWebhookEvents = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    SESSION_CREATED: 'session.created',
    SESSION_ENDED: 'session.ended',
    ORGANIZATION_CREATED: 'organization.created',
    ORGANIZATION_UPDATED: 'organization.updated',
    ORGANIZATION_DELETED: 'organization.deleted'
};
//# sourceMappingURL=clerk.js.map