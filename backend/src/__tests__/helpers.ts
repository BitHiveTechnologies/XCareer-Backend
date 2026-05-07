import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';

/**
 * Connect to the in-memory MongoDB set up by globalSetup.
 * Call this in beforeAll().
 */
export async function connectTestDB() {
  const uri = process.env.MONGODB_URI!;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

/**
 * Disconnect and drop the in-memory DB after tests.
 * Call this in afterAll().
 */
export async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}

/**
 * Clear all collections between test cases.
 * Call this in beforeEach() or afterEach().
 */
export async function clearCollections(...models: string[]) {
  for (const model of models) {
    const col = mongoose.connection.collections[model];
    if (col) await col.deleteMany({});
  }
}

/**
 * Register a test user and return the access token.
 */
export async function registerTestUser(overrides: Record<string, any> = {}) {
  const data = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User',
    ...overrides
  };
  const res = await request(app).post('/api/v1/auth/register').send(data);
  return { res, data };
}

/**
 * Login and return the access token + user id.
 */
export async function loginTestUser(email: string, password: string) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return {
    token: res.body?.data?.accessToken,
    userId: res.body?.data?.user?.id,
    res
  };
}

/**
 * Register + login in one call.
 */
export async function createAuthenticatedUser(overrides: Record<string, any> = {}) {
  const { data } = await registerTestUser(overrides);
  const { token, userId, res } = await loginTestUser(data.email, data.password);
  return { email: data.email, password: data.password, token, userId, res };
}

/**
 * Auth header helper.
 */
export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
