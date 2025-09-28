/**
 * Enhanced Job Matching Algorithm
 *
 * Calculates percentage-based match scores considering:
 * - Qualification match (25% weight)
 * - Stream/Course match (25% weight)
 * - CGPA/Academic performance (20% weight)
 * - Passing year (15% weight)
 * - Additional skills/requirements (15% weight)
 */
export interface EnhancedMatchResult {
    userId: string;
    matchPercentage: number;
    detailedScores: {
        qualification: number;
        stream: number;
        cgpa: number;
        passingYear: number;
        skills: number;
        overall: number;
    };
    matchReasons: string[];
    eligible: boolean;
}
export interface MatchingCriteria {
    qualificationWeight: number;
    streamWeight: number;
    cgpaWeight: number;
    yearWeight: number;
    skillsWeight: number;
    minimumMatchPercentage: number;
}
declare const DEFAULT_CRITERIA: MatchingCriteria;
/**
 * Calculate enhanced match percentage between user profile and job
 */
export declare const calculateEnhancedMatchPercentage: (userProfile: any, jobEligibility: any, criteria?: MatchingCriteria) => EnhancedMatchResult;
/**
 * Find users matching a job with enhanced percentage-based scoring
 */
export declare const findEligibleUsersForJob: (jobId: string, options?: {
    minimumMatchPercentage?: number;
    maxUsers?: number;
    criteria?: Partial<MatchingCriteria>;
}) => Promise<EnhancedMatchResult[]>;
/**
 * Generate a detailed match report for debugging
 */
export declare const generateMatchReport: (userProfile: any, jobEligibility: any, criteria?: MatchingCriteria) => string;
/**
 * Enhanced version of findMatchingUsersForJob with percentage-based filtering
 */
export declare const findEligibleUsersForJobEnhanced: (jobId: string, options?: {
    minimumMatchPercentage?: number;
    maxUsers?: number;
    criteria?: Partial<MatchingCriteria>;
}) => Promise<EnhancedMatchResult[]>;
export { DEFAULT_CRITERIA };
//# sourceMappingURL=enhancedJobMatching.d.ts.map