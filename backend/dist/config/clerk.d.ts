export declare const clerkConfig: {
    secretKey: string;
    publishableKey: string;
    jwtKey: string;
    webhookSecret: string;
    apiUrl: string;
    frontendApi: string;
    sessionTokenTemplate: {
        name: string;
        lifetimeInSeconds: number;
        audience: string[];
    };
};
export declare const clerkWebhookEvents: {
    USER_CREATED: string;
    USER_UPDATED: string;
    USER_DELETED: string;
    SESSION_CREATED: string;
    SESSION_ENDED: string;
    ORGANIZATION_CREATED: string;
    ORGANIZATION_UPDATED: string;
    ORGANIZATION_DELETED: string;
};
//# sourceMappingURL=clerk.d.ts.map