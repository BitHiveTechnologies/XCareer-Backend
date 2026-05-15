import request from 'supertest';
import app from '../../../app';
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createAuthenticatedUser,
  authHeader
} from '../../helpers';
import { Subscription } from '../../../models/Subscription';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles', 'subscriptions'); });

// Correct path: DELETE /api/v1/subscriptions/:subscriptionId
const BASE = '/api/v1/subscriptions';

async function createActiveSubscription(userId: string, plan = 'premium') {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  return Subscription.create({
    userId,
    plan,
    amount: plan === 'premium' ? 99 : 49,
    orderId: `order_cancel_${Date.now()}`,
    paymentId: `pay_cancel_${Date.now()}`,
    status: 'completed',
    startDate: now,
    endDate: end
  });
}

describe('DELETE /subscriptions/:id — Cancel Subscription', () => {
  it('should cancel an active subscription successfully', async () => {
    const { token, userId } = await createAuthenticatedUser();
    const sub = await createActiveSubscription(userId!);

    const res = await request(app)
      .delete(`${BASE}/${sub._id.toString()}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when subscription does not belong to this user', async () => {
    const { userId } = await createAuthenticatedUser();
    const { token: otherToken } = await createAuthenticatedUser({ email: `other_${Date.now()}@test.com` });
    const sub = await createActiveSubscription(userId!);

    const res = await request(app)
      .delete(`${BASE}/${sub._id.toString()}`)
      .set(authHeader(otherToken));

    expect(res.status).toBe(404);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await request(app)
      .delete(`${BASE}/fake_subscription_id`);

    expect(res.status).toBe(401);
  });

  it('should return 404 for a non-existent subscription', async () => {
    const { token } = await createAuthenticatedUser();
    const mongoose = await import('mongoose');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`${BASE}/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });
});
