export type EmailBatchType = 'single-job' | 'all-jobs' | 'retry';
export interface EmailBatchState {
    active: boolean;
    batchId: string | null;
    type: EmailBatchType | null;
    total: number;
    processed: number;
    sent: number;
    failed: number;
    skipped: number;
    stopRequested: boolean;
    cancelled: boolean;
    startedAt: string | null;
    finishedAt: string | null;
    lastError: string | null;
}
/** Begin tracking a new batch. Refuses if one is already active. */
export declare const startBatch: (type: EmailBatchType, total: number) => string | null;
export declare const recordSent: (n?: number) => void;
export declare const recordFailed: (err?: unknown, n?: number) => void;
export declare const recordSkipped: (n?: number) => void;
/** Request the active batch to stop. Returns false if nothing is running. */
export declare const requestStop: () => boolean;
export declare const isStopRequested: () => boolean;
/** Mark the batch finished (naturally or cancelled). */
export declare const finishBatch: () => EmailBatchState;
export declare const getBatchState: () => EmailBatchState;
//# sourceMappingURL=emailBatchControl.d.ts.map