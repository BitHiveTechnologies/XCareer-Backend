import { Job } from '../models/Job';
import { UserProfile } from '../models/UserProfile';
import { logger } from './logger';

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
  eligible: boolean; // true if > 50%
}

export interface MatchingCriteria {
  qualificationWeight: number;
  streamWeight: number;
  cgpaWeight: number;
  yearWeight: number;
  skillsWeight: number;
  minimumMatchPercentage: number;
}

// Default matching criteria
const DEFAULT_CRITERIA: MatchingCriteria = {
  qualificationWeight: 25,
  streamWeight: 25, 
  cgpaWeight: 20,
  yearWeight: 15,
  skillsWeight: 15,
  minimumMatchPercentage: 50
};

/**
 * Calculate enhanced match percentage between user profile and job
 */
export const calculateEnhancedMatchPercentage = (
  userProfile: any,
  jobEligibility: any,
  criteria: MatchingCriteria = DEFAULT_CRITERIA
): EnhancedMatchResult => {
  const scores = {
    qualification: 0,
    stream: 0,
    cgpa: 0,
    passingYear: 0,
    skills: 0,
    overall: 0
  };
  
  const reasons: string[] = [];

  // 1. QUALIFICATION MATCHING (25% weight)
  const userQualification = userProfile.qualification;
  const jobQualifications = jobEligibility.qualifications || [];
  
  if (jobQualifications.includes(userQualification)) {
    scores.qualification = criteria.qualificationWeight;
    reasons.push(`✅ Qualification: ${userQualification} matches job requirements`);
  } else {
    // Partial match for related qualifications
    const relatedQualifications = getRelatedQualifications(userQualification);
    const hasRelatedMatch = jobQualifications.some((qual: string) => relatedQualifications.includes(qual));
    
    if (hasRelatedMatch) {
      scores.qualification = criteria.qualificationWeight * 0.5;
      reasons.push(`⚠️ Qualification: ${userQualification} is related to job requirements`);
    } else {
      scores.qualification = 0;
      reasons.push(`❌ Qualification: ${userQualification} does not match job requirements`);
    }
  }

  // 2. STREAM/COURSE MATCHING (25% weight)
  const userStream = userProfile.stream;
  const jobStreams = jobEligibility.streams || [];
  
  if (jobStreams.includes(userStream)) {
    scores.stream = criteria.streamWeight;
    reasons.push(`✅ Stream: ${userStream} matches job requirements`);
  } else {
    // Partial match for related streams
    const relatedStreams = getRelatedStreams(userStream);
    const hasRelatedMatch = jobStreams.some((stream: string) => relatedStreams.includes(stream));
    
    if (hasRelatedMatch) {
      scores.stream = criteria.streamWeight * 0.6;
      reasons.push(`⚠️ Stream: ${userStream} is related to job requirements`);
    } else {
      scores.stream = 0;
      reasons.push(`❌ Stream: ${userStream} does not match job requirements`);
    }
  }

  // 3. CGPA/ACADEMIC PERFORMANCE MATCHING (20% weight)
  const userCGPA = userProfile.cgpaOrPercentage || 0;
  const minCGPA = jobEligibility.minCGPA || 0;
  const maxCGPA = jobEligibility.maxCGPA || 10;
  
  if (userCGPA >= minCGPA && userCGPA <= maxCGPA) {
    // Calculate score based on how close to max they are
    const cgpaRange = maxCGPA - minCGPA;
    const userPosition = userCGPA - minCGPA;
    const cgpaPercentile = cgpaRange > 0 ? (userPosition / cgpaRange) : 1;
    
    scores.cgpa = criteria.cgpaWeight * Math.min(1, cgpaPercentile + 0.2); // Bonus for meeting minimum
    reasons.push(`✅ CGPA: ${userCGPA} meets job requirements (${minCGPA}-${maxCGPA})`);
  } else if (userCGPA < minCGPA) {
    scores.cgpa = 0;
    reasons.push(`❌ CGPA: ${userCGPA} below minimum requirement (${minCGPA})`);
  } else {
    scores.cgpa = criteria.cgpaWeight * 0.8; // Slight penalty for being over-qualified
    reasons.push(`⚠️ CGPA: ${userCGPA} exceeds maximum range (${maxCGPA})`);
  }

  // 4. PASSING YEAR MATCHING (15% weight)
  const userYear = userProfile.yearOfPassout;
  const jobYears = jobEligibility.passoutYears || [];
  
  if (jobYears.includes(userYear)) {
    scores.passingYear = criteria.yearWeight;
    reasons.push(`✅ Passing Year: ${userYear} matches job requirements`);
  } else {
    // Check if within acceptable range (±2 years)
    const hasNearMatch = jobYears.some((year: number) => Math.abs(year - userYear) <= 2);
    
    if (hasNearMatch) {
      scores.passingYear = criteria.yearWeight * 0.7;
      reasons.push(`⚠️ Passing Year: ${userYear} is within acceptable range`);
    } else {
      scores.passingYear = 0;
      reasons.push(`❌ Passing Year: ${userYear} does not match job requirements`);
    }
  }

  // 5. SKILLS/ADDITIONAL REQUIREMENTS (15% weight)
  // For now, give partial score based on general eligibility
  // This can be enhanced when skill matching is added
  const hasBasicEligibility = scores.qualification > 0 && scores.stream > 0;
  
  if (hasBasicEligibility) {
    scores.skills = criteria.skillsWeight * 0.8; // 80% of skills score for basic eligibility
    reasons.push(`✅ Skills: Meets basic job requirements`);
  } else {
    scores.skills = criteria.skillsWeight * 0.3; // 30% for minimal eligibility
    reasons.push(`⚠️ Skills: Partial match with job requirements`);
  }

  // Calculate overall percentage
  scores.overall = scores.qualification + scores.stream + scores.cgpa + scores.passingYear + scores.skills;
  
  // Ensure percentage doesn't exceed 100%
  scores.overall = Math.min(100, scores.overall);
  
  // Determine eligibility
  const eligible = scores.overall >= criteria.minimumMatchPercentage;

  return {
    userId: '', // Will be set by the calling function
    matchPercentage: Math.round(scores.overall * 100) / 100, // Round to 2 decimal places
    detailedScores: {
      qualification: Math.round(scores.qualification * 100) / 100,
      stream: Math.round(scores.stream * 100) / 100,
      cgpa: Math.round(scores.cgpa * 100) / 100,
      passingYear: Math.round(scores.passingYear * 100) / 100,
      skills: Math.round(scores.skills * 100) / 100,
      overall: Math.round(scores.overall * 100) / 100
    },
    matchReasons: reasons,
    eligible
  };
};

/**
 * Find users matching a job with enhanced percentage-based scoring
 */
export const findEligibleUsersForJob = async (
  jobId: string,
  options: {
    minimumMatchPercentage?: number;
    maxUsers?: number;
    criteria?: Partial<MatchingCriteria>;
  } = {}
): Promise<EnhancedMatchResult[]> => {
  try {
    const {
      minimumMatchPercentage = 50,
      maxUsers = 100,
      criteria = {}
    } = options;

    // Merge with default criteria
    const matchingCriteria: MatchingCriteria = {
      ...DEFAULT_CRITERIA,
      ...criteria,
      minimumMatchPercentage
    };

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    logger.info('Starting enhanced job matching', {
      jobId,
      jobTitle: job.title,
      minimumMatchPercentage,
      maxUsers
    });

    // Get all user profiles (we'll filter by user subscription status later)
    const userProfiles = await UserProfile.find({
      // Basic filters that can be done at database level
      qualification: { $in: job.eligibility.qualifications || [] },
      stream: { $in: job.eligibility.streams || [] }
    }).populate('userId', 'email name subscriptionStatus subscriptionPlan isProfileComplete role');

    const eligibleMatches: EnhancedMatchResult[] = [];

    for (const profile of userProfiles) {
      const user = profile.userId as any;
      
      // Skip if not a regular user
      if (user.role !== 'user') continue;
      
      // Skip if subscription not active
      if (user.subscriptionStatus !== 'active') continue;
      
      // Skip if profile not complete
      if (!user.isProfileComplete) continue;

      // Calculate match percentage
      const matchResult = calculateEnhancedMatchPercentage(profile, job.eligibility, matchingCriteria);
      
      // Include user email and name in result
      matchResult.userId = user._id.toString();
      (matchResult as any).email = user.email;
      (matchResult as any).name = user.name;

      // Only include if meets minimum percentage
      if (matchResult.eligible && matchResult.matchPercentage >= minimumMatchPercentage) {
        eligibleMatches.push(matchResult);
        
        logger.debug('User meets matching criteria', {
          userId: user._id,
          email: user.email,
          matchPercentage: matchResult.matchPercentage,
          jobId
        });
      }
    }

    // Sort by match percentage (highest first)
    eligibleMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Limit results
    const limitedMatches = eligibleMatches.slice(0, maxUsers);

    logger.info('Enhanced job matching completed', {
      jobId,
      totalProfiles: userProfiles.length,
      eligibleMatches: limitedMatches.length,
      minimumMatchPercentage,
      averageMatchPercentage: limitedMatches.length > 0 
        ? Math.round((limitedMatches.reduce((sum, match) => sum + match.matchPercentage, 0) / limitedMatches.length) * 100) / 100
        : 0
    });

    return limitedMatches;

  } catch (error) {
    logger.error('Enhanced job matching failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};

/**
 * Get related qualifications for partial matching
 */
function getRelatedQualifications(qualification: string): string[] {
  const relationMap: { [key: string]: string[] } = {
    'B.Tech': ['B.E', 'B.Sc'],
    'B.E': ['B.Tech', 'B.Sc'],
    'B.Sc': ['B.Tech', 'B.E'],
    'M.Tech': ['M.E', 'M.Sc'],
    'M.E': ['M.Tech', 'M.Sc'],
    'M.Sc': ['M.Tech', 'M.E'],
    'BCA': ['B.Tech', 'B.Sc'],
    'MCA': ['M.Tech', 'M.Sc'],
    'MBA': ['M.Tech', 'M.E']
  };
  
  return relationMap[qualification] || [];
}

/**
 * Get related streams for partial matching
 */
function getRelatedStreams(stream: string): string[] {
  const relationMap: { [key: string]: string[] } = {
    'Computer Science': ['Information Technology', 'Software Engineering', 'CSE', 'IT'],
    'Information Technology': ['Computer Science', 'Software Engineering', 'CSE', 'IT'],
    'CSE': ['Computer Science', 'Information Technology', 'IT'],
    'IT': ['Information Technology', 'Computer Science', 'CSE'],
    'Software Engineering': ['Computer Science', 'Information Technology'],
    'Electronics': ['Electronics and Communication', 'ECE', 'EEE'],
    'ECE': ['Electronics', 'Electronics and Communication', 'EEE'],
    'EEE': ['Electronics', 'ECE', 'Electronics and Communication'],
    'Mechanical': ['Mechanical Engineering', 'ME'],
    'ME': ['Mechanical', 'Mechanical Engineering']
  };
  
  return relationMap[stream] || [];
}

/**
 * Generate a detailed match report for debugging
 */
export const generateMatchReport = (
  userProfile: any,
  jobEligibility: any,
  criteria: MatchingCriteria = DEFAULT_CRITERIA
): string => {
  const result = calculateEnhancedMatchPercentage(userProfile, jobEligibility, criteria);
  
  let report = `📊 MATCH ANALYSIS REPORT\n`;
  report += `========================\n\n`;
  report += `👤 User: ${userProfile.firstName} ${userProfile.lastName}\n`;
  report += `📧 Email: ${userProfile.email}\n\n`;
  report += `🎯 OVERALL MATCH: ${result.matchPercentage}%\n`;
  report += `✅ ELIGIBLE: ${result.eligible ? 'YES' : 'NO'} (${criteria.minimumMatchPercentage}% required)\n\n`;
  report += `📋 DETAILED BREAKDOWN:\n`;
  report += `   🎓 Qualification: ${result.detailedScores.qualification}% (weight: ${criteria.qualificationWeight}%)\n`;
  report += `   📚 Stream/Course: ${result.detailedScores.stream}% (weight: ${criteria.streamWeight}%)\n`;
  report += `   📈 CGPA Score: ${result.detailedScores.cgpa}% (weight: ${criteria.cgpaWeight}%)\n`;
  report += `   📅 Passing Year: ${result.detailedScores.passingYear}% (weight: ${criteria.yearWeight}%)\n`;
  report += `   🛠️ Skills: ${result.detailedScores.skills}% (weight: ${criteria.skillsWeight}%)\n\n`;
  report += `💡 MATCH REASONS:\n`;
  
  result.matchReasons.forEach((reason, index) => {
    report += `   ${index + 1}. ${reason}\n`;
  });
  
  return report;
};

/**
 * Enhanced version of findMatchingUsersForJob with percentage-based filtering
 */
export const findEligibleUsersForJobEnhanced = async (
  jobId: string,
  options: {
    minimumMatchPercentage?: number;
    maxUsers?: number;
    criteria?: Partial<MatchingCriteria>;
  } = {}
): Promise<EnhancedMatchResult[]> => {
  const {
    minimumMatchPercentage = 50,
    maxUsers = 100,
    criteria = {}
  } = options;

  const matchingCriteria: MatchingCriteria = {
    ...DEFAULT_CRITERIA,
    ...criteria,
    minimumMatchPercentage
  };

  try {
    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    logger.info('Starting enhanced job matching process', {
      jobId,
      jobTitle: job.title,
      company: job.company,
      minimumMatchPercentage,
      maxUsers,
      criteria: matchingCriteria
    });

    // Get all active users with complete profiles
    const userProfiles = await UserProfile.find({})
      .populate({
        path: 'userId',
        match: { 
          role: 'user',
          subscriptionStatus: 'active',
          isProfileComplete: true
        },
        select: 'email name subscriptionStatus subscriptionPlan isProfileComplete role'
      });

    // Filter out profiles where user population failed (inactive users)
    const validProfiles = userProfiles.filter(profile => profile.userId);

    logger.info('Found users for matching analysis', {
      totalProfiles: userProfiles.length,
      validProfiles: validProfiles.length
    });

    const eligibleMatches: EnhancedMatchResult[] = [];

    for (const profile of validProfiles) {
      const user = profile.userId as any;
      
      try {
        // Calculate enhanced match percentage
        const matchResult = calculateEnhancedMatchPercentage(profile, job.eligibility, matchingCriteria);
        
        // Add user details to result
        matchResult.userId = user._id.toString();
        (matchResult as any).email = user.email;
        (matchResult as any).name = user.name;
        (matchResult as any).userProfile = {
          qualification: profile.qualification,
          stream: profile.stream,
          cgpa: profile.cgpaOrPercentage,
          yearOfPassout: profile.yearOfPassout,
          college: profile.collegeName
        };

        // Only include if meets minimum percentage requirement
        if (matchResult.eligible && matchResult.matchPercentage >= minimumMatchPercentage) {
          eligibleMatches.push(matchResult);
          
          logger.info('User eligible for job alert', {
            userId: user._id,
            email: user.email,
            matchPercentage: matchResult.matchPercentage,
            jobId,
            jobTitle: job.title
          });
        } else {
          logger.debug('User below match threshold', {
            userId: user._id,
            email: user.email,
            matchPercentage: matchResult.matchPercentage,
            minimumRequired: minimumMatchPercentage,
            jobId
          });
        }

      } catch (error) {
        logger.warn('Error calculating match for user', {
          userId: user._id,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Sort by match percentage (highest first)
    eligibleMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Limit results
    const finalMatches = eligibleMatches.slice(0, maxUsers);

    logger.info('Enhanced matching process completed', {
      jobId,
      jobTitle: job.title,
      totalEligibleUsers: finalMatches.length,
      averageMatchPercentage: finalMatches.length > 0 
        ? Math.round((finalMatches.reduce((sum, match) => sum + match.matchPercentage, 0) / finalMatches.length) * 100) / 100
        : 0,
      highestMatchPercentage: finalMatches.length > 0 ? finalMatches[0].matchPercentage : 0,
      lowestMatchPercentage: finalMatches.length > 0 ? finalMatches[finalMatches.length - 1].matchPercentage : 0
    });

    return finalMatches;

  } catch (error) {
    logger.error('Enhanced job matching failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId
    });
    throw error;
  }
};

export { DEFAULT_CRITERIA };
