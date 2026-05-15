/**
 * JobMatchingEngine — Production-grade matching service.
 *
 * Scoring Breakdown (max 100 pts + up to 10 bonus):
 *   Qualification match : 35 pts (exact) | 15 pts (related group)
 *   Stream match        : 30 pts (exact) | 15 pts (CS/IT group)
 *   Passout year        : 20 pts (exact) | 15 (±1yr) | 10 (±2yr) | 0 (>2yr)
 *   CGPA / Percentage   : 15 pts (meets) | 8 pts (within 10% below) | 0 pts
 *   Skills bonus        : up to 10 pts based on keyword overlap
 */
export interface MatchResult {
    score: number;
    reasons: string[];
    breakdown: {
        qualification: number;
        stream: number;
        passoutYear: number;
        cgpa: number;
        skillsBonus: number;
    };
}
export interface UserMatch {
    userId: string;
    name: string;
    email: string;
    matchScore: number;
    matchReasons: string[];
    profile: {
        qualification: string;
        stream: string;
        yearOfPassout: number;
        cgpa: number;
        skills?: string;
    };
}
export interface JobMatch {
    jobId: string;
    title: string;
    company: string;
    type: 'job' | 'internship';
    location: string;
    matchScore: number;
    matchReasons: string[];
    eligibility: any;
}
export interface JobRecommendation extends JobMatch {
    salary?: string;
    stipend?: string;
    applicationLink: string;
    applicationDeadline: Date;
}
/**
 * Calculate a match score between a user profile and job eligibility criteria.
 * Returns a MatchResult with score 0–110 and human-readable breakdown.
 */
export declare const calculateMatchScore: (userProfile: any, jobEligibility: any) => MatchResult;
/**
 * Find all users whose profiles qualify for a specific job.
 * Uses a relaxed DB query + post-filter with score-based sorting.
 *
 * @param jobId - the job to match against
 * @param limit - max users to return (default 100)
 * @param minScore - minimum score threshold (default 50)
 */
export declare const findMatchingUsersForJob: (jobId: string, limit?: number, minScore?: number) => Promise<UserMatch[]>;
/**
 * Find all active jobs that match a given user's profile.
 */
export declare const findMatchingJobsForUser: (userId: string, limit?: number, minScore?: number) => Promise<JobMatch[]>;
export declare const getJobRecommendations: (userId: string, options?: {
    minScore?: number;
    limit?: number;
}) => Promise<JobRecommendation[]>;
export declare const getMatchingStatistics: () => Promise<{
    totalUsers: number;
    totalJobs: number;
    averageMatchScore: number;
    topQualifications: any[];
    topStreams: any[];
    matchingEfficiency: string;
    lastUpdated: Date;
}>;
//# sourceMappingURL=jobMatchingService.d.ts.map