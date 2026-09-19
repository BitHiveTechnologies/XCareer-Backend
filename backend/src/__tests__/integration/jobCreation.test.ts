/**
 * Integration Tests — Job & Internship Creation
 *
 * Covers every bug fixed and every validation rule on the
 * POST /api/v1/jobs/ endpoint:
 *
 *  Bug #1 — Empty eligibility arrays must be rejected (min(1))
 *  Bug #2 — applicationDeadline date-only strings must be accepted when
 *            they represent a future date (ISO conversion fix)
 *  Bug #3 — passoutYears 2000-2030 range must be accepted (was min 2020)
 *
 * Auth scenarios:
 *  - No token → 401
 *  - Regular user token → 403
 *  - Admin token → allowed
 */

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections, authHeader } from '../helpers';
import { Admin } from '../../models/Admin';
import { Job } from '../../models/Job';
import { generateToken } from '../../utils/jwt';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates an Admin document and returns a valid JWT for it. */
async function createAdminToken(role: 'admin' | 'super_admin' = 'admin') {
  const adminId = new mongoose.Types.ObjectId();
  await Admin.create({
    _id: adminId,
    email: `admin_${Date.now()}@test.com`,
    password: 'AdminPass123!',
    name: 'Test Admin',
    role,
    isActive: true,
  });

  const token = generateToken({
    userId: adminId.toString(),
    id: adminId.toString(),
    email: `admin_${Date.now()}@test.com`,
    role,
    type: 'admin',
  });

  return { adminId, token };
}

/** Returns a fully-valid job payload (future deadline). */
function validJobPayload(overrides: Record<string, any> = {}) {
  const deadline = new Date();
  deadline.setFullYear(deadline.getFullYear() + 1); // always in the future

  return {
    title: 'Software Engineer',
    company: 'Acme Corp',
    description: 'We are looking for a talented software engineer to join our team and build great products.',
    type: 'job',
    eligibility: {
      qualifications: ['B.Tech', 'M.Tech'],
      streams: ['CSE', 'IT'],
      passoutYears: [2023, 2024, 2025],
      minCGPA: 6.5,
    },
    applicationDeadline: deadline.toISOString(),
    applicationLink: 'https://acme.com/careers/software-engineer',
    location: 'remote',
    salary: '₹10-15 LPA',
    ...overrides,
  };
}

/** Returns a fully-valid internship payload. */
function validInternshipPayload(overrides: Record<string, any> = {}) {
  return validJobPayload({
    title: 'Frontend Intern',
    type: 'internship',
    salary: undefined,
    stipend: '₹15,000/month',
    ...overrides,
  });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

const JOBS_URL = '/api/v1/jobs/';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearCollections('admins', 'jobs');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Authentication', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post(JOBS_URL).send(validJobPayload());
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when an invalid / malformed token is provided', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set('Authorization', 'Bearer totally.invalid.token')
      .send(validJobPayload());
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when a regular user token is provided (not admin)', async () => {
    // Generate a token with role=user
    const userId = new mongoose.Types.ObjectId();
    const userToken = generateToken({
      userId: userId.toString(),
      id: userId.toString(),
      email: 'user@test.com',
      role: 'user',
      type: 'user',
    });

    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(userToken))
      .send(validJobPayload());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/admin/i);
  });

  it('allows an admin token through', async () => {
    const { token } = await createAdminToken('admin');
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload());

    // Must NOT be 401/403 — we accept 201 or 400 (validation) here
    expect([201, 400]).toContain(res.status);
  });

  it('allows a super_admin token through', async () => {
    const { token } = await createAdminToken('super_admin');
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload());

    expect([201, 400]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Validation: required fields', () => {
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('rejects missing title', async () => {
    const { title: _t, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.details.join(' ')).toMatch(/title/i);
  });

  it('rejects title shorter than 5 characters', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ title: 'Dev' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing company', async () => {
    const { company: _c, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.details.join(' ')).toMatch(/company/i);
  });

  it('rejects missing description', async () => {
    const { description: _d, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });

  it('rejects description shorter than 20 characters', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ description: 'Too short.' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid type value', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ type: 'freelance' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid location value', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ location: 'wfh' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing applicationLink', async () => {
    const { applicationLink: _l, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });

  it('rejects non-URL applicationLink', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ applicationLink: 'not-a-url' }));
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Bug #1: Empty eligibility arrays', () => {
  /**
   * Before the fix, the frontend sent empty arrays as fallback defaults,
   * and the backend route would accept them (Joi min(1) was present but
   * the frontend had no guard). These tests verify the backend always
   * enforces min(1) on each eligibility array.
   */
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('rejects empty qualifications array', async () => {
    const payload = validJobPayload({
      eligibility: { qualifications: [], streams: ['CSE'], passoutYears: [2024] },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details.join(' ')).toMatch(/qualif/i);
  });

  it('rejects empty streams array', async () => {
    const payload = validJobPayload({
      eligibility: { qualifications: ['B.Tech'], streams: [], passoutYears: [2024] },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.details.join(' ')).toMatch(/stream/i);
  });

  it('rejects empty passoutYears array', async () => {
    const payload = validJobPayload({
      eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [] },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.details.join(' ')).toMatch(/passout|year/i);
  });

  it('rejects all three empty arrays at once', async () => {
    const payload = validJobPayload({
      eligibility: { qualifications: [], streams: [], passoutYears: [] },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
    // Should report multiple errors
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects missing eligibility object entirely', async () => {
    const { eligibility: _e, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Bug #2: applicationDeadline date handling', () => {
  /**
   * The HTML date picker returns "YYYY-MM-DD". The fix converts this to
   * a full ISO timestamp ("YYYY-MM-DDT23:59:59.000Z") before sending to
   * the backend. These tests verify the backend handles both formats and
   * correctly rejects past dates.
   */
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('accepts a full ISO 8601 future date string', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ applicationDeadline: future.toISOString() }));
    expect(res.status).toBe(201);
  });

  it('accepts a date-only string (YYYY-MM-DD) in the future', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const dateOnly = future.toISOString().split('T')[0]; // "2027-09-19"
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ applicationDeadline: dateOnly }));
    // Joi accepts date-only as valid ISO date; Mongoose pre-save interprets
    // as midnight UTC which is still future — should pass
    expect(res.status).toBe(201);
  });

  it('accepts an end-of-day ISO string (what the fix produces)', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const eod = future.toISOString().split('T')[0] + 'T23:59:59.000Z';
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ applicationDeadline: eod }));
    expect(res.status).toBe(201);
  });

  it('rejects a past ISO date', async () => {
    const past = new Date('2020-01-01T00:00:00.000Z');
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ applicationDeadline: past.toISOString() }));
    // Joi min(new Date()) → 400, or Mongoose pre-save throws → 500
    // Both indicate rejection
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('rejects a missing applicationDeadline', async () => {
    const { applicationDeadline: _d, ...payload } = validJobPayload() as any;
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Bug #3: passoutYears 2000-2030 range', () => {
  /**
   * Before the fix, the route had min(2020), but the Mongoose model
   * allows 2000-2030. Years like 2019, 2015 were unfairly rejected at the
   * route layer. The fix aligns both to min(2000).
   */
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('accepts passoutYear 2024 (always valid)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2024] } }));
    expect(res.status).toBe(201);
  });

  it('accepts passoutYear 2000 (new minimum after fix)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2000] } }));
    expect(res.status).toBe(201);
  });

  it('accepts passoutYear 2019 (previously rejected by route min 2020)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2019] } }));
    expect(res.status).toBe(201);
  });

  it('accepts passoutYear 2030 (max boundary)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2030] } }));
    expect(res.status).toBe(201);
  });

  it('rejects passoutYear 1999 (below minimum)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [1999] } }));
    expect(res.status).toBe(400);
  });

  it('rejects passoutYear 2031 (above maximum)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2031] } }));
    expect(res.status).toBe(400);
  });

  it('accepts multiple passoutYears spanning the full valid range', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({
        eligibility: {
          qualifications: ['B.Tech'],
          streams: ['CSE'],
          passoutYears: [2000, 2010, 2020, 2025, 2030],
        },
      }));
    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Happy Path: Job creation', () => {
  let token: string;
  let adminId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    ({ token, adminId } = await createAdminToken());
  });

  it('creates a job and returns 201 with job data', async () => {
    const payload = validJobPayload();
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.job).toBeDefined();
    expect(res.body.data.job.title).toBe(payload.title);
    expect(res.body.data.job.company).toBe(payload.company);
    expect(res.body.data.job.type).toBe('job');
  });

  it('persists the job in the database', async () => {
    const payload = validJobPayload({ title: 'Persisted Job Check' });
    await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);

    const saved = await Job.findOne({ title: 'Persisted Job Check' });
    expect(saved).not.toBeNull();
    expect(saved!.company).toBe(payload.company);
    expect(saved!.isActive).toBe(true);
    expect(saved!.postedBy.toString()).toBe(adminId.toString());
  });

  it('sets isActive to true by default', async () => {
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(validJobPayload());
    const saved = await Job.findById(res.body.data.job.id);
    expect(saved!.isActive).toBe(true);
  });

  it('stores all eligibility fields correctly', async () => {
    const payload = validJobPayload({
      eligibility: {
        qualifications: ['B.Tech', 'MCA'],
        streams: ['CSE', 'IT', 'ECE'],
        passoutYears: [2022, 2023, 2024],
        minCGPA: 7.5,
      },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(201);

    const saved = await Job.findById(res.body.data.job.id);
    expect(saved!.eligibility.qualifications).toEqual(expect.arrayContaining(['B.Tech', 'MCA']));
    expect(saved!.eligibility.streams).toEqual(expect.arrayContaining(['CSE', 'IT', 'ECE']));
    expect(saved!.eligibility.passoutYears).toEqual(expect.arrayContaining([2022, 2023, 2024]));
    expect(saved!.eligibility.minCGPA).toBe(7.5);
  });

  it('accepts all three location types', async () => {
    for (const location of ['remote', 'onsite', 'hybrid'] as const) {
      const res = await request(app)
        .post(JOBS_URL)
        .set(authHeader(token))
        .send(validJobPayload({ location }));
      expect(res.status).toBe(201);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Happy Path: Internship creation', () => {
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('creates an internship with type=internship and returns 201', async () => {
    const payload = validInternshipPayload();
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.job.type).toBe('internship');
  });

  it('persists an internship in the database', async () => {
    const payload = validInternshipPayload({ title: 'Persisted Internship Check' });
    await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);

    const saved = await Job.findOne({ title: 'Persisted Internship Check' });
    expect(saved).not.toBeNull();
    expect(saved!.type).toBe('internship');
  });

  it('accepts stipend for internship (optional field)', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validInternshipPayload({ stipend: '₹20,000/month' }));
    expect(res.status).toBe(201);
    const saved = await Job.findById(res.body.data.job.id);
    expect(saved!.stipend).toBe('₹20,000/month');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/jobs/ — Edge Cases', () => {
  let token: string;

  beforeEach(async () => {
    ({ token } = await createAdminToken());
  });

  it('rejects title exceeding 200 characters', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ title: 'A'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('rejects description exceeding 5000 characters', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ description: 'D'.repeat(5001) }));
    expect(res.status).toBe(400);
  });

  it('rejects salary exceeding 100 characters', async () => {
    const res = await request(app)
      .post(JOBS_URL)
      .set(authHeader(token))
      .send(validJobPayload({ salary: 'S'.repeat(101) }));
    expect(res.status).toBe(400);
  });

  it('rejects minCGPA below 0', async () => {
    const payload = validJobPayload({
      eligibility: {
        qualifications: ['B.Tech'],
        streams: ['CSE'],
        passoutYears: [2024],
        minCGPA: -1,
      },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });

  it('rejects minCGPA above 10', async () => {
    const payload = validJobPayload({
      eligibility: {
        qualifications: ['B.Tech'],
        streams: ['CSE'],
        passoutYears: [2024],
        minCGPA: 11,
      },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(400);
  });

  it('accepts optional minCGPA = 0', async () => {
    const payload = validJobPayload({
      eligibility: { qualifications: ['B.Tech'], streams: ['CSE'], passoutYears: [2024], minCGPA: 0 },
    });
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(payload);
    expect(res.status).toBe(201);
  });

  it('creates two different jobs without conflict', async () => {
    const [r1, r2] = await Promise.all([
      request(app).post(JOBS_URL).set(authHeader(token)).send(validJobPayload({ title: 'Job One Unique' })),
      request(app).post(JOBS_URL).set(authHeader(token)).send(validJobPayload({ title: 'Job Two Unique' })),
    ]);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r1.body.data.job.id).not.toBe(r2.body.data.job.id);
  });

  it('returns a timestamp in the response', async () => {
    const res = await request(app).post(JOBS_URL).set(authHeader(token)).send(validJobPayload());
    expect(res.status).toBe(201);
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });
});
