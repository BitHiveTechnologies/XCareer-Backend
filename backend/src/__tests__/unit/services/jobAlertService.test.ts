/**
 * Integration tests for Job Alert routes
 * Tests: POST /send-all, POST /send/:jobId, GET /statistics, POST /retry-failed
 *
 * These tests run against an in-memory MongoDB (no real email sent — emailService is mocked).
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app';
import { connectTestDB, disconnectTestDB, clearCollections, registerTestUser, loginTestUser } from '../../helpers';

// ─── Mock email service so no real emails are sent ───────────────────────────
jest.mock('../../../utils/emailService', () => ({
  emailService: {
    sendJobAlertEmail: jest.fn().mockResolvedValue(true),
    sendEmail: jest.fn().mockResolvedValue(true)
  }
}));

// ─── Mock subscriptionService so users appear active ─────────────────────────
jest.mock('../../../utils/subscriptionService', () => ({
  checkSubscriptionStatus: jest.fn().mockResolvedValue({ isActive: true, status: 'active', plan: 'basic' })
}));

let adminToken: string;
let testJobId: string;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections('users', 'jobs', 'jobnotifications', 'subscriptions', 'userprofiles');

  // Create an admin user directly in DB
  const { User } = await import('../../../models/User');
  const bcrypt = await import('bcryptjs');
  const adminPass = await bcrypt.hash('AdminPass123!', 4);
  const admin = await User.create({
    name: 'Test Admin',
    email: `admin_${Date.now()}@test.com`,
    password: adminPass,
    mobile: '9000000001',
    role: 'admin',
    type: 'admin',
    isProfileComplete: true
  });

  // Login to get token
  const { generateToken } = await import('../../../utils/jwt');
  adminToken = generateToken({
    id: (admin._id as any).toString(),
    userId: (admin._id as any).toString(),
    email: admin.email,
    role: 'admin',
    type: 'admin'
  });

  // Create a test job
  const { Job } = await import('../../../models/Job');
  const job = await Job.create({
    title: 'Software Engineer',
    company: 'TestCorp',
    location: 'remote',
    type: 'job',
    description: 'Looking for react node.js developer',
    applicationLink: 'https://testcorp.com/apply',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    postedBy: admin._id,
    eligibility: {
      qualifications: ['B.E', 'B.Tech'],
      streams: ['CSE', 'IT'],
      passoutYears: [2023, 2024, 2025],
      minCGPA: 6.0
    }
  });
  testJobId = (job._id as any).toString();
});

// ─── Statistics Endpoint ──────────────────────────────────────────────────────
describe('GET /api/v1/jobs/alerts/statistics', () => {
  test('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/jobs/alerts/statistics');
    expect(res.status).toBe(401);
  });

  test('should return statistics with valid admin token', async () => {
    const res = await request(app)
      .get('/api/v1/jobs/alerts/statistics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statistics).toBeDefined();
    expect(typeof res.body.data.statistics.totalNotifications).toBe('number');
    expect(typeof res.body.data.statistics.sentNotifications).toBe('number');
    expect(typeof res.body.data.statistics.failedNotifications).toBe('number');
  });

  test('should filter statistics by jobId query param', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/alerts/statistics?jobId=${testJobId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.jobId).toBe(testJobId);
  });
});

// ─── Send All Job Alerts ──────────────────────────────────────────────────────
describe('POST /api/v1/jobs/alerts/send-all', () => {
  test('should return 401 without token', async () => {
    const res = await request(app).post('/api/v1/jobs/alerts/send-all');
    expect(res.status).toBe(401);
  });

  test('should complete with 0 eligible users when no profiles exist', async () => {
    const res = await request(app)
      .post('/api/v1/jobs/alerts/send-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ minMatchScore: 50, maxUsersPerJob: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalJobs).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalEmailsSent).toBe(0); // no profiles = no matches
  });

  test('should support dryRun mode', async () => {
    const res = await request(app)
      .post('/api/v1/jobs/alerts/send-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dryRun: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('dry run');
  });

  test('should send emails when matching user profile exists', async () => {
    // Create a matching user
    const { User } = await import('../../../models/User');
    const { UserProfile } = await import('../../../models/UserProfile');
    const bcrypt = await import('bcryptjs');

    const userPass = await bcrypt.hash('UserPass123!', 4);
    const user = await User.create({
      name: 'Test User',
      email: `user_${Date.now()}@test.com`,
      password: userPass,
      mobile: '9000000002',
      role: 'user',
      type: 'user',
      isProfileComplete: true,
      subscriptionStatus: 'active'
    });

    await UserProfile.create({
      userId: user._id,
      firstName: 'Test',
      lastName: 'User',
      email: user.email,
      contactNumber: '9000000002',
      dateOfBirth: new Date('2000-01-01'),
      qualification: 'B.E',
      stream: 'CSE',
      yearOfPassout: 2024,
      cgpaOrPercentage: 8.0,
      collegeName: 'Test College',
      skills: 'react, node.js'
    });

    const res = await request(app)
      .post('/api/v1/jobs/alerts/send-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ minMatchScore: 50 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // With a matching profile, emails should have been sent
    expect(res.body.data.totalEmailsSent).toBeGreaterThanOrEqual(1);
  });
});

// ─── Send Alerts for Single Job ───────────────────────────────────────────────
describe('POST /api/v1/jobs/alerts/send/:jobId', () => {
  test('should return 401 without token', async () => {
    const res = await request(app).post(`/api/v1/jobs/alerts/send/${testJobId}`);
    expect(res.status).toBe(401);
  });

  test('should return 500 for non-existent jobId', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/v1/jobs/alerts/send/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(500);
  });

  test('should return stats for valid job with no matching users', async () => {
    const res = await request(app)
      .post(`/api/v1/jobs/alerts/send/${testJobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ minMatchScore: 50 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe(testJobId);
    expect(typeof res.body.data.emailsSent).toBe('number');
  });

  test('should prevent duplicate notifications on second call', async () => {
    const { User } = await import('../../../models/User');
    const { UserProfile } = await import('../../../models/UserProfile');
    const bcrypt = await import('bcryptjs');

    const userPass = await bcrypt.hash('UserPass123!', 4);
    const user = await User.create({
      name: 'Dup User',
      email: `dup_${Date.now()}@test.com`,
      password: userPass,
      mobile: '9000000003',
      role: 'user',
      type: 'user',
      isProfileComplete: true,
      subscriptionStatus: 'active'
    });

    await UserProfile.create({
      userId: user._id,
      firstName: 'Dup',
      lastName: 'User',
      email: user.email,
      contactNumber: '9000000003',
      dateOfBirth: new Date('2001-01-01'),
      qualification: 'B.E',
      stream: 'CSE',
      yearOfPassout: 2024,
      cgpaOrPercentage: 8.0,
      collegeName: 'Test College'
    });

    // First send
    const res1 = await request(app)
      .post(`/api/v1/jobs/alerts/send/${testJobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ minMatchScore: 50 });

    // Second send — should see duplicates
    const res2 = await request(app)
      .post(`/api/v1/jobs/alerts/send/${testJobId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ minMatchScore: 50 });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // Second run should have 0 new emails (all duplicates)
    expect(res2.body.data.duplicateNotifications).toBeGreaterThanOrEqual(1);
    expect(res2.body.data.emailsSent).toBe(0);
  });
});

// ─── Retry Failed Notifications ───────────────────────────────────────────────
describe('POST /api/v1/jobs/alerts/retry-failed', () => {
  test('should return 401 without token', async () => {
    const res = await request(app).post('/api/v1/jobs/alerts/retry-failed');
    expect(res.status).toBe(401);
  });

  test('should succeed with empty result when no failed notifications', async () => {
    const res = await request(app)
      .post('/api/v1/jobs/alerts/retry-failed')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.retried).toBe(0);
  });

  test('should retry and succeed for failed notification', async () => {
    const { User } = await import('../../../models/User');
    const { JobNotification } = await import('../../../models/JobNotification');
    const bcrypt = await import('bcryptjs');

    const userPass = await bcrypt.hash('UserPass123!', 4);
    const user = await User.create({
      name: 'Retry User',
      email: `retry_${Date.now()}@test.com`,
      password: userPass,
      mobile: '9000000004',
      role: 'user',
      type: 'user',
      isProfileComplete: true
    });

    // Inject a failed notification
    await JobNotification.create({
      userId: user._id,
      jobId: new mongoose.Types.ObjectId(testJobId),
      emailStatus: 'failed',
      matchScore: 75,
      matchReasons: ['Test reason'],
      isAutomatic: true,
      retryCount: 0
    });

    const res = await request(app)
      .post('/api/v1/jobs/alerts/retry-failed')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.retried).toBe(1);
    expect(res.body.data.result.successful).toBe(1);
  });
});

// ─── Scheduler Status ─────────────────────────────────────────────────────────
describe('GET /api/v1/jobs/alerts/scheduler/status', () => {
  test('should return scheduler status', async () => {
    const res = await request(app)
      .get('/api/v1/jobs/alerts/scheduler/status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBeDefined();
    expect(typeof res.body.data.status.enabled).toBe('boolean');
  });
});
