import { MatchingCriteria, DEFAULT_CRITERIA } from '../utils/enhancedJobMatching';
export interface EnhancedJobAlertResult {
    jobId: string;
    jobTitle: string;
    company: string;
    totalEligibleUsers: number;
    emailsSent: number;
    emailsFailed: number;
    duplicateNotifications: number;
    averageMatchPercentage: number;
    userMatches: {
        email: string;
        matchPercentage: number;
        emailSent: boolean;
        emailStatus: 'sent' | 'failed' | 'duplicate';
    }[];
    dryRun: boolean;
}
export interface EnhancedJobAlertOptions {
    jobId: string;
    minimumMatchPercentage?: number;
    maxUsers?: number;
    dryRun?: boolean;
    customCriteria?: Partial<MatchingCriteria>;
}
/**
 * Send job alerts using enhanced percentage-based matching
 */
export declare const sendJobAlertsEnhanced: (options: EnhancedJobAlertOptions) => Promise<EnhancedJobAlertResult>;
/**
 * Send job alerts for all active jobs using enhanced matching
 */
export declare const sendAllJobAlertsEnhanced: (options?: {
    minimumMatchPercentage?: number;
    maxUsersPerJob?: number;
    dryRun?: boolean;
    customCriteria?: Partial<MatchingCriteria>;
}) => Promise<{
    [jobId: string]: EnhancedJobAlertResult;
}>;
export { DEFAULT_CRITERIA };
//# sourceMappingURL=enhancedJobAlertService.d.ts.map