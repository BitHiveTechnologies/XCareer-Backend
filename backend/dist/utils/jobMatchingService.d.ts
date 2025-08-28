export interface JobMatch {
    jobId: string;
    title: string;
    company: string;
    type: 'job' | 'internship';
    location: string;
    matchScore: number;
    matchReasons: string[];
    eligibility: any;
    userQualifications: any;
}
export interface UserMatch {
    userId: string;
    name: string;
    email: string;
    matchScore: number;
    matchReasons: string[];
    profile: any;
}
export interface JobRecommendation {
    jobId: string;
    title: string;
    company: string;
    type: 'job' | 'internship';
    location: string;
    matchScore: number;
    matchReasons: string[];
}
export interface AdvancedJobMatch {
    jobId: string;
    title: string;
    company: string;
    type: 'job' | 'internship';
    location: string;
    salary?: string;
    stipend?: string;
    baseMatchScore: number;
    advancedMatchScore: number;
    matchReasons: DetailedMatchReason[];
    applicationDeadline: Date;
    postedDate: Date;
}
export interface DetailedMatchReason {
    type: 'qualification' | 'stream' | 'experience' | 'location' | 'cgpa';
    message: string;
    score: number;
}
export interface MatchingStatistics {
    totalUsers: number;
    totalJobs: number;
    averageMatchScore: number;
    topQualifications: string[];
    topStreams: string[];
    matchingEfficiency: 'low' | 'medium' | 'high';
    lastUpdated: Date;
}
/**
 * Calculate match score between user and job
 */
export declare const calculateMatchScore: (userProfile: any, jobEligibility: any) => {
    score: number;
    reasons: string[];
};
/**
 * Find jobs that match a specific user
 */
export declare const findMatchingJobsForUser: (userId: string, limit?: number) => Promise<JobMatch[]>;
/**
 * Find users that match a specific job
 */
export declare const findMatchingUsersForJob: (jobId: string, limit?: number) => Promise<UserMatch[]>;
/**
 * Get job recommendations for a user
 */
export declare const getJobRecommendations: (userId: string, preferences?: {
    preferredJobTypes?: ("job" | "internship")[];
    preferredLocations?: string[];
    minMatchScore?: number;
    maxResults?: number;
}) => Promise<JobMatch[]>;
/**
 * Get advanced matching statistics for analytics
 */
export declare const getMatchingStatistics: () => Promise<MatchingStatistics>;
/**
 * Find jobs with advanced filtering and scoring
 */
export declare const findMatchingJobsAdvanced: (userId: string, filters: {
    jobTypes?: string[];
    locations?: string[];
    qualifications?: string[];
    streams?: string[];
    minSalary?: number;
    maxSalary?: number;
    experienceLevel?: string;
}, options: {
    limit: number;
    offset: number;
    sortBy: "relevance" | "date" | "salary";
}) => Promise<AdvancedJobMatch[]>;
//# sourceMappingURL=jobMatchingService.d.ts.map