import request from 'supertest';
import app from '../../../app';
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createAuthenticatedUser,
  authHeader
} from '../../helpers';
import { User } from '../../../models/User';
import { Subscription } from '../../../models/Subscription';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  await clearCollections('users', 'subscriptions');
});

const BASE = '/api/v1/admin';

describe('GET /admin/dashboard/stats', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get(`${BASE}/dashboard/stats`);
    expect(res.status).toBe(401);
  });

  it('should return 403 when a regular user tries to access stats', async () => {
    const { token } = await createAuthenticatedUser('user@test.com', 'user');
    const res = await request(app)
      .get(`${BASE}/dashboard/stats`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return dashboard stats for an admin', async () => {
    const { token } = await createAuthenticatedUser('admin@test.com', 'admin');
    
    // Create some dummy data
    await User.create({ email: 'user1@test.com', name: 'User 1', password: 'Password123!', role: 'user' });
    await User.create({ email: 'user2@test.com', name: 'User 2', password: 'Password123!', role: 'user' });

    const res = await request(app)
      .get(`${BASE}/dashboard/stats`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview.totalUsers).toBeGreaterThanOrEqual(3); // 2 users + 1 admin
    expect(res.body.data.growth).toBeDefined();
    expect(res.body.data.growth.users).toBeDefined();
  });

  it('should calculate 100% growth if there were no users last month', async () => {
    const { token } = await createAuthenticatedUser('admin@test.com', 'admin');
    
    // All users created now (this month)
    await User.create({ email: 'new1@test.com', name: 'New 1', password: 'Password123!', role: 'user' });

    const res = await request(app)
      .get(`${BASE}/dashboard/stats`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    // Since previous month had 0 users, growth should be 100%
    expect(res.body.data.growth.users.percentage).toBe(100);
  });

  it('should return distribution data', async () => {
    const { token } = await createAuthenticatedUser('admin@test.com', 'admin');
    
    const res = await request(app)
      .get(`${BASE}/dashboard/stats`)
      .set(authHeader(token));

    expect(res.body.data.distributions).toBeDefined();
    expect(res.body.data.distributions.userRoles).toBeDefined();
    expect(res.body.data.distributions.subscriptionPlans).toBeDefined();
  });
});
