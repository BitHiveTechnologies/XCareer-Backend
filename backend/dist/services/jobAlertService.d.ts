export interface JobAlertStats {
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
}
/**
 * Send job alerts to eligible users for a specific job
 */
export declare const sendJobAlertsForJob: (options: JobAlertOptions) => Promise<JobAlertStats>;
/**
 * Send job alerts for all active jobs (for scheduled tasks)
 */
export declare const sendJobAlertsForAllActiveJobs: (options?: {
    minMatchScore?: number;
    maxUsersPerJob?: number;
    dryRun?: boolean;
}) => Promise<{
    [jobId: string]: JobAlertStats;
}>;
/**
 * Get job alert statistics
 */
export declare const getJobAlertStats: (jobId?: string) => Promise<{
    totalNotifications: number;
    sentNotifications: number;
    failedNotifications: number;
    pendingNotifications: number;
    averageMatchScore: number;
    topMatchReasons: string[];
}>;
/**
 * Retry failed job notifications
 */
export declare const retryFailedJobNotifications: (jobId?: string) => Promise<{
    retried: number;
    successful: number;
    failed: number;
}>;
//# sourceMappingURL=jobAlertService.d.ts.map