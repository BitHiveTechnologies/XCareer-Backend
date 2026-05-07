import request from 'supertest';
import app from '../../../app';
import { connectTestDB, disconnectTestDB, clearCollections, createAuthenticatedUser, authHeader } from '../../helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles', 'subscriptions'); });

const BASE = '/api/v1/auth';

describe('GET /auth/me', () => {
  it('should return the current user data for an authenticated user', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get(`${BASE}/me`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBeDefined();
  });

  it('should include subscriptionInfo in the /me response (premium badge support)', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get(`${BASE}/me`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user.subscriptionInfo).toBeDefined();
    expect(typeof res.body.data.user.subscriptionInfo.isActive).toBe('boolean');
    expect(typeof res.body.data.user.subscriptionInfo.daysRemaining).toBe('number');
    expect(res.body.data.user.subscriptionInfo.plan).toBeDefined();
  });

  it('should include mustChangePassword flag in /me response', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request(app)
      .get(`${BASE}/me`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(typeof res.body.data.user.mustChangePassword).toBe('boolean');
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for an invalid/malformed token', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set({ Authorization: 'Bearer this.is.invalid' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should NOT expose the user password in /me response', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request(app)
      .get(`${BASE}/me`)
      .set(authHeader(token));

    expect(res.body.data.user.password).toBeUndefined();
  });
});
