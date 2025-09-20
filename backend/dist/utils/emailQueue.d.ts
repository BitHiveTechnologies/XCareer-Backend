import { EmailData } from './emailService';
export interface EmailJobData {
    emailData: EmailData;
    attempts: number;
    maxAttempts: number;
    delay?: number;
    priority?: number;
}
export declare class EmailQueueService {
    private isInitialized;
    private stats;
    constructor();
    /**
     * Add email job and process immediately (no queuing)
     */
    addEmailJob(emailData: EmailData, options?: {
        delay?: number;
        priority?: number;
        attempts?: number;
    }): Promise<{
        id: string;
        status: string;
    } | null>;
    /**
     * Get queue status (simulated for compatibility)
     */
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    /**
     * Clear queue (no-op for simple mode)
     */
    clearQueue(): Promise<void>;
    /**
     * Close queue (no-op for simple mode)
     */
    closeQueue(): Promise<void>;
    /**
     * Get detailed statistics
     */
    getStats(): {
        totalProcessed: number;
        successRate: string;
        totalFailed: number;
        totalSucceeded: number;
    };
}
export declare const emailQueueService: EmailQueueService;
//# sourceMappingURL=emailQueue.d.ts.map