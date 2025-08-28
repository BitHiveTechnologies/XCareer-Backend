import { Job } from '../models/Job';
import { UserProfile } from '../models/UserProfile';
import { logger } from './logger';

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
export const calculateMatchScore = (
  userProfile: any,
  jobEligibility: any
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  // Qualification match (40% weight)
  const qualificationMatch = userProfile.qualification === jobEligibility.qualifications[0] ||
    jobEligibility.qualifications.includes(userProfile.qualification);
  
  if (qualificationMatch) {
    score += 40;
    reasons.push('Qualification matches job requirements');
  } else {
    reasons.push('Qualification does not match job requirements');
  }

  // Stream match (30% weight)
  const streamMatch = userProfile.stream === jobEligibility.streams[0] ||
    jobEligibility.streams.includes(userProfile.stream);
  
  if (streamMatch) {
    score += 30;
    reasons.push('Academic stream matches job requirements');
  } else {
    reasons.push('Academic stream does not match job requirements');
  }

  // Passout year match (20% weight)
  const yearMatch = jobEligibility.passoutYears.includes(userProfile.yearOfPassout);
  if (yearMatch) {
    score += 20;
    reasons.push('Graduation year matches job requirements');
  } else {
    const yearDiff = Math.abs(userProfile.yearOfPassout - Math.min(...jobEligibility.passoutYears));
    if (yearDiff <= 1) {
      score += 10;
      reasons.push('Graduation year is within acceptable range');
    } else {
      reasons.push('Graduation year does not match job requirements');
    }
  }

  // CGPA match (10% weight)
  if (jobEligibility.minCGPA && userProfile.cgpaOrPercentage) {
    const userCGPA = userProfile.cgpaOrPercentage;
    if (userCGPA >= jobEligibility.minCGPA) {
      score += 10;
      reasons.push(`CGPA (${userCGPA}) meets minimum requirement (${jobEligibility.minCGPA})`);
    } else {
      reasons.push(`CGPA (${userCGPA}) below minimum requirement (${jobEligibility.minCGPA})`);
    }
  } else {
    score += 10;
    reasons.push('No CGPA requirement specified');
  }

  // Bonus points for exact matches
  if (qualificationMatch && streamMatch && yearMatch) {
    score += 5;
    reasons.push('Perfect match bonus');
  }

  return { score, reasons };
};

/**
 * Find jobs that match a specific user
 */
export const findMatchingJobsForUser = async (
  userId: string,
  limit: number = 20
): Promise<JobMatch[]> => {
  try {
    const userProfile = await UserProfile.findOne({ userId }).populate('userId', 'name email');
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    const jobMatches: JobMatch[] = [];

    for (const job of jobs) {
      const { score, reasons } = calculateMatchScore(userProfile, job.eligibility);
      
      if (score > 0) {
        jobMatches.push({
          jobId: job._id.toString(),
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          matchScore: score,
          matchReasons: reasons,
          eligibility: job.eligibility,
          userQualifications: {
            qualification: userProfile.qualification,
            stream: userProfile.stream,
            yearOfPassout: userProfile.yearOfPassout,
            cgpa: userProfile.cgpaOrPercentage
          }
        });
      }
    }

    return jobMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

  } catch (error) {
    logger.error('Find matching jobs for user failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    throw error;
  }
};

/**
 * Find users that match a specific job
 */
export const findMatchingUsersForJob = async (
  jobId: string,
  limit: number = 50
): Promise<UserMatch[]> => {
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const query: any = {};
    
    if (job.eligibility.qualifications.length > 0) {
      query.qualification = { $in: job.eligibility.qualifications };
    }
    
    if (job.eligibility.streams.length > 0) {
      query.stream = { $in: job.eligibility.streams };
    }
    
    if (job.eligibility.passoutYears.length > 0) {
      query.yearOfPassout = { $in: job.eligibility.passoutYears };
    }

    const userProfiles = await UserProfile.find(query)
      .populate('userId', 'name email')
      .limit(limit * 2);

    const userMatches: UserMatch[] = [];

    for (const profile of userProfiles) {
      if (job.eligibility.minCGPA && profile.cgpaOrPercentage < job.eligibility.minCGPA) {
        continue;
      }

      const { score, reasons } = calculateMatchScore(profile, job.eligibility);
      
      if (score > 0) {
        userMatches.push({
          userId: (profile.userId as any)._id.toString(),
          name: (profile.userId as any).name,
          email: (profile.userId as any).email,
          matchScore: score,
          matchReasons: reasons,
          profile: {
            qualification: profile.qualification,
            stream: profile.stream,
            yearOfPassout: profile.yearOfPassout,
            cgpa: profile.cgpaOrPercentage
          }
        });
      }
    }

    return userMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

  } catch (error) {
    logger.error('Find matching users for job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};

/**
 * Get job recommendations for a user
 */
export const getJobRecommendations = async (
  userId: string,
  preferences: {
    preferredJobTypes?: ('job' | 'internship')[];
    preferredLocations?: string[];
    minMatchScore?: number;
    maxResults?: number;
  } = {}
): Promise<JobMatch[]> => {
  try {
    const {
      preferredJobTypes = ['job', 'internship'],
      preferredLocations = ['remote', 'onsite', 'hybrid'],
      minMatchScore = 40,
      maxResults = 15
    } = preferences;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const jobs = await Job.find({
      isActive: true,
      type: { $in: preferredJobTypes },
      location: { $in: preferredLocations },
      applicationDeadline: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const jobMatches: JobMatch[] = [];

    for (const job of jobs) {
      const { score, reasons } = calculateMatchScore(userProfile, job.eligibility);
      
      if (score >= minMatchScore) {
        jobMatches.push({
          jobId: job._id.toString(),
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          matchScore: score,
          matchReasons: reasons,
          eligibility: job.eligibility,
          userQualifications: {
            qualification: userProfile.qualification,
            stream: userProfile.stream,
            yearOfPassout: userProfile.yearOfPassout,
            cgpa: userProfile.cgpaOrPercentage
          }
        });
      }
    }

    return jobMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);

  } catch (error) {
    logger.error('Get job recommendations failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    throw error;
  }
};

/**
 * Generate detailed match reasons for a user-job combination
 */
const generateMatchReasons = (userProfile: any, job: any): string[] => {
  const reasons: string[] = [];
  
  // Qualification match
  const qualificationMatch = userProfile.qualifications?.some((qual: string) =>
    job.eligibility.qualifications.includes(qual)
  ) || userProfile.qualification === job.eligibility.qualifications[0];
  
  if (qualificationMatch) {
    reasons.push(`Qualification match: ${userProfile.qualifications?.join(', ') || userProfile.qualification}`);
  }
  
  // Stream match
  if (job.eligibility.streams.includes(userProfile.stream)) {
    reasons.push(`Stream match: ${userProfile.stream}`);
  }
  
  // Passout year match
  if (job.eligibility.passoutYears.includes(userProfile.yearOfPassout)) {
    reasons.push(`Recent graduate (${userProfile.yearOfPassout})`);
  }
  
  // Location preference
  if (job.location === 'remote') {
    reasons.push('Remote work available');
  }
  
  return reasons;
};

/**
 * Get advanced matching statistics for analytics
 */
export const getMatchingStatistics = async (): Promise<MatchingStatistics> => {
  try {
    const totalUsers = await UserProfile.countDocuments();
    const totalJobs = await Job.countDocuments({ isActive: true });
    
    // Get qualification distribution
    const qualificationStats = await UserProfile.aggregate([
      { $unwind: '$qualifications' },
      { $group: { _id: '$qualifications', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get stream distribution
    const streamStats = await UserProfile.aggregate([
      { $group: { _id: '$stream', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Calculate average match scores (placeholder for now)
    const averageMatchScore = 75; // This would be calculated from actual matches
    
    return {
      totalUsers,
      totalJobs,
      averageMatchScore,
      topQualifications: qualificationStats.map(stat => stat._id),
      topStreams: streamStats.map(stat => stat._id),
      matchingEfficiency: 'high',
      lastUpdated: new Date()
    };
  } catch (error) {
    logger.error('Get matching statistics failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Find jobs with advanced filtering and scoring
 */
export const findMatchingJobsAdvanced = async (
  userId: string,
  filters: {
    jobTypes?: string[];
    locations?: string[];
    qualifications?: string[];
    streams?: string[];
    minSalary?: number;
    maxSalary?: number;
    experienceLevel?: string;
  },
  options: {
    limit: number;
    offset: number;
    sortBy: 'relevance' | 'date' | 'salary';
  }
): Promise<AdvancedJobMatch[]> => {
  try {
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Build query based on filters
    const query: any = { isActive: true, applicationDeadline: { $gt: new Date() } };
    
    if (filters.jobTypes?.length) {
      query.type = { $in: filters.jobTypes };
    }
    
    if (filters.locations?.length) {
      query.location = { $in: filters.locations };
    }
    
    if (filters.qualifications?.length) {
      query['eligibility.qualifications'] = { $in: filters.qualifications };
    }
    
    if (filters.streams?.length) {
      query['eligibility.streams'] = { $in: filters.streams };
    }

    // Find matching jobs
    const jobs = await Job.find(query)
      .populate('postedBy', 'name company')
      .limit(options.limit)
      .skip(options.offset);

    // Calculate advanced scores and create matches
    const advancedMatches: AdvancedJobMatch[] = jobs.map(job => {
      const baseScore = calculateMatchScore(userProfile, job.eligibility).score;
      const advancedScore = calculateAdvancedScore(userProfile, job, filters);
      const matchReasons = generateDetailedMatchReasons(userProfile, job);
      
      return {
        jobId: job._id.toString(),
        title: job.title,
        company: (job.postedBy as any)?.name || 'Unknown Company',
        type: job.type,
        location: job.location,
        salary: job.salary,
        stipend: job.stipend,
        baseMatchScore: baseScore,
        advancedMatchScore: advancedScore,
        matchReasons,
        applicationDeadline: job.applicationDeadline,
        postedDate: job.createdAt
      };
    });

    // Sort based on options
    switch (options.sortBy) {
      case 'relevance':
        advancedMatches.sort((a, b) => b.advancedMatchScore - a.advancedMatchScore);
        break;
      case 'date':
        advancedMatches.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        break;
      case 'salary':
        advancedMatches.sort((a, b) => (parseInt(b.salary || '0') - parseInt(a.salary || '0')));
        break;
    }

    return advancedMatches;
  } catch (error) {
    logger.error('Advanced job matching failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    throw error;
  }
};

/**
 * Calculate advanced match score with additional factors
 */
const calculateAdvancedScore = (userProfile: any, job: any, filters: any): number => {
  let score = calculateMatchScore(userProfile, job.eligibility).score;
  
  // Bonus for exact qualification match
  if (filters.qualifications?.includes(userProfile.qualifications?.[0] || userProfile.qualification)) {
    score += 10;
  }
  
  // Bonus for preferred location
  if (filters.locations?.includes(job.location)) {
    score += 5;
  }
  
  // Bonus for recent posting (within 7 days)
  const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSincePosted <= 7) {
    score += 3;
  }
  
  return Math.min(100, score);
};

/**
 * Generate detailed match reasons with explanations
 */
const generateDetailedMatchReasons = (userProfile: any, job: any): DetailedMatchReason[] => {
  const reasons: DetailedMatchReason[] = [];
  
  // Qualification analysis
  const qualificationMatch = userProfile.qualifications?.some((qual: string) =>
    job.eligibility.qualifications.includes(qual)
  ) || userProfile.qualification === job.eligibility.qualifications[0];
  
  if (qualificationMatch) {
    reasons.push({
      type: 'qualification',
      message: `Your ${userProfile.qualifications?.join(', ') || userProfile.qualification} qualification(s) match the job requirements`,
      score: 25
    });
  }
  
  // Stream analysis
  if (job.eligibility.streams.includes(userProfile.stream)) {
    reasons.push({
      type: 'stream',
      message: `Your ${userProfile.stream} stream is exactly what they're looking for`,
      score: 20
    });
  }
  
  // Experience level analysis
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = currentYear - userProfile.yearOfPassout;
  if (yearsSinceGraduation <= 2) {
    reasons.push({
      type: 'experience',
      message: `Recent graduate (${yearsSinceGraduation} year${yearsSinceGraduation === 1 ? '' : 's'} experience)`,
      score: 15
    });
  }
  
  // Location preference
  if (job.location === 'remote') {
    reasons.push({
      type: 'location',
      message: 'Remote work available - flexible location',
      score: 10
    });
  }
  
  return reasons;
};
