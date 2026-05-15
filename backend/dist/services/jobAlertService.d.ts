export interface JobAlertStats {
    jobId: string;
    jobTitle: string;
    totalEligibleUsers: number;
    emailsSent: number;
    emailsFailed: number;
    duplicateNotifications: number;
    usersWithoutProfile: number;
    usersWithInactiveSubscription: number;
}
export interface JobAlertOptions {
    jobId: string;
    minMatchScore?: number;
    maxUsers?: number;
    dryRun?: boolean;
    force?: boolean;
    isAutomatic?: boolean;
    triggeredBy?: string;
}
export interface BulkAlertResult {
    totalJobs: number;
    totalEligibleUsers: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalDuplicates: number;
    perJob: Record<string, JobAlertStats>;
}
/**
 * Send job alerts to eligible users for a specific job.
 * - Skips users who already received this job notification (dedup) unless force=true
 * - Skips users with inactive subscriptions
 * - Records matchScore, matchReasons, retryCount in DB
 */
export declare const sendJobAlertsForJob: (options: JobAlertOptions) => Promise<JobAlertStats>;
/**
 * Send job alerts for ALL active jobs that have not yet expired.
 * Aggregates matches so each user receives only ONE email with all matching jobs.
 */
export declare const sendJobAlertsForAllActiveJobs: (options?: {
    minMatchScore?: number;
    maxUsersPerJob?: number;
    dryRun?: boolean;
    force?: boolean;
    isAutomatic?: boolean;
    triggeredBy?: string;
}) => Promise<BulkAlertResult>;
/**
 * Retry all failed job notifications that haven't exceeded MAX_RETRIES.
 */
export declare const retryFailedJobNotifications: (jobId?: string) => Promise<{
    retried: number;
    successful: number;
    failed: number;
    skippedMaxRetries: number;
}>;
export declare const getJobAlertStats: (jobId?: string) => Promise<{
    totalNotifications: number;
    sentNotifications: number;
    failedNotifications: number;
    pendingNotifications: number;
    automaticNotifications: number;
    manualNotifications: number;
    averageMatchScore: number;
}>;
//# sourceMappingURL=jobAlertService.d.ts.map