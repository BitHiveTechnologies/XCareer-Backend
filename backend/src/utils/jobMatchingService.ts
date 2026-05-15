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

import { Job } from '../models/Job';
import { UserProfile } from '../models/UserProfile';
import { User } from '../models/User';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchResult {
  score: number;            // 0–110
  reasons: string[];        // human-readable explanation
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

// ─── Qualification Groupings ───────────────────────────────────────────────────

/** CS/IT related qualification aliases for soft-matching */
const CS_QUALIFICATIONS = new Set([
  'B.E', 'B.Tech', 'M.Tech', 'M.E', 'BCA', 'MCA', 'B.Sc (CS)', 'B.Sc (IT)',
  'B.Sc', 'M.Sc', 'B.C.A', 'M.C.A'
]);

/** CS/IT streams that are closely related */
const CS_STREAMS = new Set([
  'CSE', 'IT', 'Computer Science', 'Information Technology',
  'CS', 'Computer Engineering', 'Software Engineering',
  'Artificial Intelligence', 'AI & ML', 'Data Science',
  'AI', 'ML', 'Data Engineering', 'Cyber Security'
]);

/** Engineering streams that are closely related */
const ENGINEERING_STREAMS = new Set([
  'ECE', 'EEE', 'EE', 'Electronics', 'Electrical', 'Electronics and Communication',
  'Embedded Systems', 'VLSI', 'Robotics', 'Mechatronics'
]);

// ─── Core Scoring Function ─────────────────────────────────────────────────────

/**
 * Calculate a match score between a user profile and job eligibility criteria.
 * Returns a MatchResult with score 0–110 and human-readable breakdown.
 */
export const calculateMatchScore = (
  userProfile: any,
  jobEligibility: any
): MatchResult => {
  const breakdown = { qualification: 0, stream: 0, passoutYear: 0, cgpa: 0, skillsBonus: 0 };
  const reasons: string[] = [];

  const jobQuals: string[] = jobEligibility.qualifications || [];
  const jobStreams: string[] = jobEligibility.streams || [];
  const jobYears: number[] = jobEligibility.passoutYears || [];
  const minCGPA: number | undefined = jobEligibility.minCGPA;

  const userQual: string = userProfile.qualification || '';
  const userStream: string = userProfile.stream || '';
  const userYear: number = userProfile.yearOfPassout || 0;
  const userCGPA: number = userProfile.cgpaOrPercentage || 0;
  const userSkills: string = (userProfile.skills || '').toLowerCase();

  // ─── 1. Qualification (35 pts) ─────────────────────────────────────────────
  if (jobQuals.length === 0) {
    // No requirement specified → full points
    breakdown.qualification = 35;
    reasons.push('No specific qualification required');
  } else if (jobQuals.includes(userQual)) {
    breakdown.qualification = 35;
    reasons.push(`Qualification matches: ${userQual}`);
  } else {
    // Check if same education group (e.g., both CS qualifications)
    const userIsCS = CS_QUALIFICATIONS.has(userQual);
    const jobNeedsCS = jobQuals.some((q: string) => CS_QUALIFICATIONS.has(q));
    if (userIsCS && jobNeedsCS) {
      breakdown.qualification = 15;
      reasons.push(`Related qualification: ${userQual} (partial match)`);
    } else {
      reasons.push(`Qualification not matched (required: ${jobQuals.join(', ')})`);
    }
  }

  // ─── 2. Stream (30 pts) ───────────────────────────────────────────────────
  if (jobStreams.length === 0) {
    breakdown.stream = 30;
    reasons.push('No specific stream required');
  } else if (jobStreams.includes(userStream)) {
    breakdown.stream = 30;
    reasons.push(`Stream matches: ${userStream}`);
  } else {
    // CS/IT soft match
    const userIsCSStream = CS_STREAMS.has(userStream);
    const jobNeedsCSStream = jobStreams.some((s: string) => CS_STREAMS.has(s));
    const userIsEng = ENGINEERING_STREAMS.has(userStream);
    const jobNeedsEng = jobStreams.some((s: string) => ENGINEERING_STREAMS.has(s));

    if (userIsCSStream && jobNeedsCSStream) {
      breakdown.stream = 15;
      reasons.push(`Related CS/IT stream: ${userStream} (partial match)`);
    } else if (userIsEng && jobNeedsEng) {
      breakdown.stream = 12;
      reasons.push(`Related Engineering stream: ${userStream} (partial match)`);
    } else {
      reasons.push(`Stream not matched (required: ${jobStreams.join(', ')})`);
    }
  }

  // ─── 3. Passout Year (20 pts) ─────────────────────────────────────────────
  if (jobYears.length === 0) {
    breakdown.passoutYear = 20;
    reasons.push('No specific passout year required');
  } else if (jobYears.includes(userYear)) {
    breakdown.passoutYear = 20;
    reasons.push(`Passout year matches: ${userYear}`);
  } else {
    const closestYear = jobYears.reduce((prev: number, curr: number) =>
      Math.abs(curr - userYear) < Math.abs(prev - userYear) ? curr : prev
    );
    const diff = Math.abs(userYear - closestYear);
    if (diff === 1) {
      breakdown.passoutYear = 15;
      reasons.push(`Passout year within 1 year of requirement (${userYear})`);
    } else if (diff === 2) {
      breakdown.passoutYear = 10;
      reasons.push(`Passout year within 2 years of requirement (${userYear})`);
    } else {
      reasons.push(`Passout year ${userYear} is outside expected range`);
    }
  }

  // ─── 4. CGPA / Percentage (15 pts) ────────────────────────────────────────
  if (!minCGPA || minCGPA === 0) {
    breakdown.cgpa = 15;
    reasons.push('No minimum CGPA required');
  } else if (userCGPA >= minCGPA) {
    breakdown.cgpa = 15;
    reasons.push(`CGPA/Percentage ${userCGPA} meets requirement (min: ${minCGPA})`);
  } else {
    const deficit = minCGPA - userCGPA;
    const thresholdTolerance = minCGPA * 0.10; // 10% tolerance
    if (deficit <= thresholdTolerance) {
      breakdown.cgpa = 8;
      reasons.push(`CGPA/Percentage ${userCGPA} slightly below min ${minCGPA} (within 10%)`);
    } else {
      reasons.push(`CGPA/Percentage ${userCGPA} below minimum ${minCGPA}`);
    }
  }

  // ─── 5. Skills Bonus (up to 10 pts) ──────────────────────────────────────
  if (userSkills && userSkills.length > 0) {
    // Extract words from job title + description for skill matching
    const jobText = `${jobEligibility.jobTitle || ''} ${jobEligibility.description || ''}`.toLowerCase();
    const skillWords = userSkills.split(/[,\s]+/).filter((s: string) => s.length > 2);
    const matchedSkills: string[] = [];

    for (const skill of skillWords) {
      if (jobText.includes(skill)) {
        matchedSkills.push(skill);
      }
    }

    if (matchedSkills.length > 0) {
      // 2 pts per matched skill, max 10
      breakdown.skillsBonus = Math.min(10, matchedSkills.length * 2);
      reasons.push(`Skills matched: ${matchedSkills.slice(0, 5).join(', ')} (+${breakdown.skillsBonus} pts)`);
    }
  }

  const score = breakdown.qualification + breakdown.stream + breakdown.passoutYear +
    breakdown.cgpa + breakdown.skillsBonus;

  return { score, reasons, breakdown };
};

// ─── Find Users Matching a Job ────────────────────────────────────────────────

/**
 * Find all users whose profiles qualify for a specific job.
 * Uses a relaxed DB query + post-filter with score-based sorting.
 *
 * @param jobId - the job to match against
 * @param limit - max users to return (default 100)
 * @param minScore - minimum score threshold (default 50)
 */
export const findMatchingUsersForJob = async (
  jobId: string,
  limit: number = 100,
  minScore: number = 50
): Promise<UserMatch[]> => {
  try {
    const job = await Job.findById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const jobEligibility = {
      ...job.eligibility,
      jobTitle: job.title,
      description: job.description
    };

    // Relaxed DB query — widen passout year range by ±2 years so we don't miss
    // users that the strict $in would reject
    const dbQuery: any = {};
    if (job.eligibility.qualifications?.length > 0) {
      // Include exact + related qualifications
      const relatedQuals = [...job.eligibility.qualifications];
      // Add CS group if any job qual is CS-related
      const jobNeedsCS = job.eligibility.qualifications.some(q => CS_QUALIFICATIONS.has(q));
      if (jobNeedsCS) {
        CS_QUALIFICATIONS.forEach(q => relatedQuals.push(q));
      }
      dbQuery.qualification = { $in: [...new Set(relatedQuals)] };
    }

    if (job.eligibility.passoutYears?.length > 0) {
      const minYear = Math.min(...job.eligibility.passoutYears) - 2;
      const maxYear = Math.max(...job.eligibility.passoutYears) + 2;
      dbQuery.yearOfPassout = { $gte: minYear, $lte: maxYear };
    }

    const userProfiles = await UserProfile.find(dbQuery)
      .populate('userId', 'name email isProfileComplete subscriptionStatus')
      .limit(limit * 3) // fetch more than needed, then filter by score
      .lean();

    const matches: UserMatch[] = [];

    for (const profile of userProfiles) {
      const populatedUser = profile.userId as any;
      if (!populatedUser || !populatedUser.name || !populatedUser.email) continue;

      // Only alert users with active subscriptions
      if (populatedUser.subscriptionStatus !== 'active') continue;

      const { score, reasons } = calculateMatchScore(profile, jobEligibility);

      if (score >= minScore) {
        matches.push({
          userId: populatedUser._id.toString(),
          name: populatedUser.name,
          email: populatedUser.email,
          matchScore: score,
          matchReasons: reasons,
          profile: {
            qualification: profile.qualification,
            stream: profile.stream,
            yearOfPassout: profile.yearOfPassout,
            cgpa: profile.cgpaOrPercentage,
            skills: profile.skills
          }
        });
      }
    }

    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

  } catch (error) {
    logger.error('findMatchingUsersForJob failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};

// ─── Find Jobs Matching a User ────────────────────────────────────────────────

/**
 * Find all active jobs that match a given user's profile.
 */
export const findMatchingJobsForUser = async (
  userId: string,
  limit: number = 20,
  minScore: number = 50
): Promise<JobMatch[]> => {
  try {
    const profile = await UserProfile.findOne({ userId }).lean();
    if (!profile) return [];

    const user = await User.findById(userId).lean();
    if (!user) return [];

    const jobs = await Job.find({
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    }).lean();

    const matches: JobMatch[] = [];

    for (const job of jobs) {
      const eligibility = { ...job.eligibility, jobTitle: job.title, description: job.description };
      const { score, reasons } = calculateMatchScore(profile, eligibility);
      if (score >= minScore) {
        matches.push({
          jobId: (job._id as any).toString(),
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          matchScore: score,
          matchReasons: reasons,
          eligibility: job.eligibility
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    logger.error('findMatchingJobsForUser failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    throw error;
  }
};

// ─── Job Recommendations for User ────────────────────────────────────────────

export const getJobRecommendations = async (
  userId: string,
  options: { minScore?: number; limit?: number } = {}
): Promise<JobRecommendation[]> => {
  const { minScore = 50, limit = 15 } = options;
  try {
    const profile = await UserProfile.findOne({ userId }).lean();
    if (!profile) return [];

    const jobs = await Job.find({
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    }).lean();

    const recommendations: JobRecommendation[] = [];

    for (const job of jobs) {
      const eligibility = { ...job.eligibility, jobTitle: job.title, description: job.description };
      const { score, reasons } = calculateMatchScore(profile, eligibility);
      if (score >= minScore) {
        recommendations.push({
          jobId: (job._id as any).toString(),
          title: job.title,
          company: job.company,
          type: job.type,
          location: job.location,
          matchScore: score,
          matchReasons: reasons,
          eligibility: job.eligibility,
          salary: job.salary,
          stipend: job.stipend,
          applicationLink: job.applicationLink,
          applicationDeadline: job.applicationDeadline
        });
      }
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    logger.error('getJobRecommendations failed', { error, userId });
    return [];
  }
};

// ─── Matching Statistics ──────────────────────────────────────────────────────

export const getMatchingStatistics = async () => {
  const totalUsers = await UserProfile.countDocuments();
  const totalJobs = await Job.countDocuments({ isActive: true });

  const qualificationStats = await UserProfile.aggregate([
    { $group: { _id: '$qualification', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const streamStats = await UserProfile.aggregate([
    { $group: { _id: '$stream', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalUsers,
    totalJobs,
    averageMatchScore: 0, // calculated from actual notifications in production
    topQualifications: qualificationStats.map(s => s._id),
    topStreams: streamStats.map(s => s._id),
    matchingEfficiency: totalUsers > 0 && totalJobs > 0 ? 'high' : 'low',
    lastUpdated: new Date()
  };
};
