/**
 * Unit tests for the new Job Matching Engine (utils/jobMatchingService.ts)
 * Tests the calculateMatchScore function with various user/job combinations.
 */
import { calculateMatchScore } from '../../../utils/jobMatchingService';

describe('calculateMatchScore', () => {
  const baseJob = {
    qualifications: ['B.E', 'B.Tech'],
    streams: ['CSE', 'IT'],
    passoutYears: [2023, 2024],
    minCGPA: 7.0,
    jobTitle: 'Software Engineer',
    description: 'Looking for react node.js developer'
  };

  // ─── Perfect Match ──────────────────────────────────────────────────────────
  test('should give maximum base score for perfect match', () => {
    const profile = {
      qualification: 'B.E',
      stream: 'CSE',
      yearOfPassout: 2024,
      cgpaOrPercentage: 8.5,
      skills: 'react, node.js, mongodb'
    };
    const { score, breakdown } = calculateMatchScore(profile, baseJob);
    // 35 (qual) + 30 (stream) + 20 (year) + 15 (cgpa) = 100 + skills bonus
    expect(score).toBeGreaterThanOrEqual(100);
    expect(breakdown.qualification).toBe(35);
    expect(breakdown.stream).toBe(30);
    expect(breakdown.passoutYear).toBe(20);
    expect(breakdown.cgpa).toBe(15);
  });

  // ─── Qualification ──────────────────────────────────────────────────────────
  test('should give 35 pts for exact qualification match', () => {
    const profile = { qualification: 'B.Tech', stream: 'Other', yearOfPassout: 2025, cgpaOrPercentage: 6 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.qualification).toBe(35);
  });

  test('should give 15 pts for related CS qualification (MCA)', () => {
    const profile = { qualification: 'MCA', stream: 'Other', yearOfPassout: 2025, cgpaOrPercentage: 6 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.qualification).toBe(15);
  });

  test('should give 0 pts for unrelated qualification', () => {
    const profile = { qualification: 'MBBS', stream: 'Other', yearOfPassout: 2025, cgpaOrPercentage: 6 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.qualification).toBe(0);
  });

  test('should give full qual pts when job has no qualification requirement', () => {
    const job = { ...baseJob, qualifications: [] };
    const profile = { qualification: 'MBBS', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, job);
    expect(breakdown.qualification).toBe(35);
  });

  // ─── Stream ─────────────────────────────────────────────────────────────────
  test('should give 30 pts for exact stream match', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.stream).toBe(30);
  });

  test('should give 15 pts for related CS/IT stream (Data Science)', () => {
    const profile = { qualification: 'B.E', stream: 'Data Science', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.stream).toBe(15);
  });

  test('should give 12 pts for related Engineering stream (ECE vs EEE job)', () => {
    // Job that accepts EEE — ECE is in the same Engineering group → 12 pts
    const engJob = { ...baseJob, streams: ['EEE', 'Electrical'] };
    const profile = { qualification: 'B.E', stream: 'ECE', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, engJob);
    expect(breakdown.stream).toBe(12);
  });

  test('should give 0 pts for unrelated stream', () => {
    const profile = { qualification: 'B.E', stream: 'Agriculture', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.stream).toBe(0);
  });

  // ─── Passout Year ───────────────────────────────────────────────────────────
  test('should give 20 pts for exact passout year match', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.passoutYear).toBe(20);
  });

  test('should give 15 pts for passout year ±1', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2025, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.passoutYear).toBe(15);
  });

  test('should give 10 pts for passout year ±2', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2026, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.passoutYear).toBe(10);
  });

  test('should give 0 pts for passout year >2 years off', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2019, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.passoutYear).toBe(0);
  });

  test('should give full year pts when job has no year requirement', () => {
    const job = { ...baseJob, passoutYears: [] };
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2010, cgpaOrPercentage: 8 };
    const { breakdown } = calculateMatchScore(profile, job);
    expect(breakdown.passoutYear).toBe(20);
  });

  // ─── CGPA ───────────────────────────────────────────────────────────────────
  test('should give 15 pts for CGPA meeting threshold', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 7.5 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.cgpa).toBe(15);
  });

  test('should give 8 pts for CGPA within 10% below threshold (7.0 * 0.9 = 6.3)', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 6.5 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.cgpa).toBe(8);
  });

  test('should give 0 pts for CGPA far below threshold', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 5.0 };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.cgpa).toBe(0);
  });

  test('should give 15 pts when no CGPA requirement', () => {
    const job = { ...baseJob, minCGPA: undefined };
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 5.0 };
    const { breakdown } = calculateMatchScore(profile, job);
    expect(breakdown.cgpa).toBe(15);
  });

  // ─── Skills Bonus ───────────────────────────────────────────────────────────
  test('should give skills bonus for keyword match in job description', () => {
    const profile = {
      qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8,
      skills: 'react, node.js, mongodb'
    };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.skillsBonus).toBeGreaterThan(0);
  });

  test('should give 0 skills bonus when no skills provided', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8, skills: '' };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.skillsBonus).toBe(0);
  });

  test('should cap skills bonus at 10 pts', () => {
    const profile = {
      qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8,
      skills: 'react, node.js, mongodb, developer, software, engineer, looking'
    };
    const { breakdown } = calculateMatchScore(profile, baseJob);
    expect(breakdown.skillsBonus).toBeLessThanOrEqual(10);
  });

  // ─── Minimum Threshold ──────────────────────────────────────────────────────
  test('should return reasons array with meaningful content', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 8 };
    const { reasons } = calculateMatchScore(profile, baseJob);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some(r => r.includes('matches'))).toBe(true);
  });

  test('poor match should score below 50', () => {
    const profile = { qualification: 'MBBS', stream: 'Agriculture', yearOfPassout: 2010, cgpaOrPercentage: 5 };
    const { score } = calculateMatchScore(profile, baseJob);
    expect(score).toBeLessThan(50);
  });

  test('good match should score at or above 50', () => {
    const profile = { qualification: 'B.E', stream: 'CSE', yearOfPassout: 2024, cgpaOrPercentage: 7.5 };
    const { score } = calculateMatchScore(profile, baseJob);
    expect(score).toBeGreaterThanOrEqual(50);
  });
});
