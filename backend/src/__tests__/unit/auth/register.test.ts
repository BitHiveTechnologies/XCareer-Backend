import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from '../../helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles'); });

const BASE = '/api/v1/auth';

describe('POST /auth/register', () => {
  const validPayload = {
    email: 'register@example.com',
    password: 'Password123!',
    name: 'Test User'
  };

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
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 400 when registering with a duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(validPayload);
    const res = await request(app).post(`${BASE}/register`).send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  it('should return 400 when name is missing (validation requires name)', async () => {
    const noNamePayload = { email: 'noname@example.com', password: 'Password123!' };
    const res = await request(app).post(`${BASE}/register`).send(noNamePayload);

    // Joi validation requires name — should be 400 not 500
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 or 400 when email is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ password: 'Password123!', name: 'Test' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should create user+profile when all profile fields are provided', async () => {
    const fullPayload = {
      email: 'fullprofile@example.com',
      password: 'Password123!',
      name: 'Full Profile User',
      mobile: '9876543210',
      qualification: 'B.Tech',
      stream: 'CSE',
      yearOfPassout: 2022,
      cgpaOrPercentage: 8.5
    };
    const res = await request(app).post(`${BASE}/register`).send(fullPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.user.firstName).toBeDefined();
  });

  it('should create user without profile when extra profile fields are missing', async () => {
    // name is required by Joi, but optional profile fields (qualification, stream) can be absent
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'noprofile@example.com', password: 'Password123!', name: 'No Profile' });

    expect(res.status).toBe(201);
    // profile fields will be absent since optional fields missing
    expect(res.body.data.user.email).toBe('noprofile@example.com');
  });
});
