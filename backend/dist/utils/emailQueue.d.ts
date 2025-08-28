import Queue from 'bull';
import { EmailData } from './emailService';
export interface EmailJobData {
    emailData: EmailData;
    attempts: number;
    maxAttempts: number;
    delay?: number;
    priority?: number;
}
export declare class EmailQueueService {
    private emailQueue;
    private isInitialized;
    constructor();
    private initializeQueue;
    private setupQueueHandlers;
    addEmailJob(emailData: EmailData, options?: {
        delay?: number;
        priority?: number;
        attempts?: number;
    }): Promise<Queue.Job<EmailJobData> | null>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    clearQueue(): Promise<void>;
    closeQueue(): Promise<void>;
}
export declare const emailQueueService: EmailQueueService;
//# sourceMappingURL=emailQueue.d.ts.map