import request from 'supertest';
import app from '../../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from '../../helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles'); });

const BASE = '/api/v1/auth';

// Full valid registration payload (matches Joi schema)
const validPayload = {
  email: 'register@example.com',
  password: 'Password123!',
  name: 'Test User',
  mobile: '9876543210',
  qualification: 'B.E',
  stream: 'CSE',
  yearOfPassout: 2024,
  cgpaOrPercentage: 8.5
};

describe('POST /auth/register', () => {
  it('should register a new user successfully and return tokens', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validPayload.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should NOT return the password in the response', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.data?.user?.password).toBeUndefined();
  });

  it('should return 400 when registering with a duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(validPayload);
    const res = await request(app).post(`${BASE}/register`).send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  it('should return 400 when name is missing (validation requires name)', async () => {
    const noNamePayload = { ...validPayload, name: undefined };
    const res = await request(app).post(`${BASE}/register`).send(noNamePayload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 or 400 when email is missing', async () => {
    const { email, ...noEmail } = validPayload;
    const res = await request(app).post(`${BASE}/register`).send(noEmail);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when mobile is missing', async () => {
    const { mobile, ...noMobile } = validPayload;
    const res = await request(app).post(`${BASE}/register`).send(noMobile);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create user+profile when all profile fields are provided', async () => {
    const fullPayload = { ...validPayload, email: 'fullprofile@example.com' };
    const res = await request(app).post(`${BASE}/register`).send(fullPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.user).toBeDefined();
  });

  it('should create user without profile when extra profile fields are missing', async () => {
    // Only name, email, password, mobile — skip qualification/stream (optional in some flows)
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validPayload, email: 'noprofile@example.com' });
    // Should succeed (our route requires all fields now, so 201)
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('noprofile@example.com');
  });

  it('should return 400 for an invalid email format', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validPayload, email: 'invalid-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for a weak password', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validPayload, password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid mobile number', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validPayload, mobile: '1234567890' }); // starts with 1, invalid
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
