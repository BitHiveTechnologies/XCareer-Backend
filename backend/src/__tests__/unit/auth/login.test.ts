import request from 'supertest';
import app from '../../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from '../../helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles'); });

const BASE = '/api/v1/auth';

const TEST_USER = {
  email: 'login@example.com',
  password: 'Password123!',
  name: 'Login User'
};

async function createUser() {
  return request(app).post(`${BASE}/register`).send(TEST_USER);
}

describe('POST /auth/login', () => {
  it('should login successfully with correct credentials', async () => {
    await createUser();
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
  });

  it('should NOT include the password in the login response', async () => {
    await createUser();
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 401 for incorrect password', async () => {
    await createUser();
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'ghost@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return user role in the response', async () => {
    await createUser();
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.body.data.user.role).toBeDefined();
    expect(['user', 'admin', 'super_admin']).toContain(res.body.data.user.role);
  });

  it('should reject login when email is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ password: 'Password123!' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/refresh', () => {
  it('should return a new access token given a valid refresh token', async () => {
    await createUser();
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const refreshToken = loginRes.body.data.refreshToken;
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject an invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when refresh token is missing', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
