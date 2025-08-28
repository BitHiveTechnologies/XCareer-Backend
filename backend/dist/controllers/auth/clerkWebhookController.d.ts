import { Request, Response } from 'express';
export interface ClerkWebhookPayload {
    data: {
        id: string;
        email_addresses: Array<{
            email_address: string;
            id: string;
            verification: {
                status: string;
            };
        }>;
        first_name?: string;
        last_name?: string;
        public_metadata?: Record<string, any>;
        private_metadata?: Record<string, any>;
        created_at: number;
        updated_at: number;
    };
    object: string;
    type: string;
}
/**
 * Handle Clerk webhook events
 */
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=clerkWebhookController.d.ts.map