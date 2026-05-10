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

const BASE = '/api/v1/payments';

async function createActiveSubscription(userId: string, plan = 'premium') {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  return Subscription.create({
    userId,
    plan,
    amount: plan === 'premium' ? 99 : 49,
    orderId: `order_cancel_${Date.now()}`,
    paymentId: 'test_pay_id',
    status: 'completed',
    startDate: now,
    endDate: end
  });
}

describe('POST /payments/cancel', () => {
  it('should cancel an active subscription successfully', async () => {
    const { token, userId } = await createAuthenticatedUser();
    const sub = await createActiveSubscription(userId!);

    const res = await request(app)
      .post(`${BASE}/cancel-subscription`)
      .set(authHeader(token))
      .send({ subscriptionId: sub._id.toString(), reason: 'Not needed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscription.status).toBe('cancelled');
  });

  it('should return 400 when cancelling an already-cancelled subscription', async () => {
    const { token, userId } = await createAuthenticatedUser();
    const sub = await createActiveSubscription(userId!);

    // Cancel once
    await request(app)
      .post(`${BASE}/cancel-subscription`)
      .set(authHeader(token))
      .send({ subscriptionId: sub._id.toString() });

    // Try to cancel again
    const res = await request(app)
      .post(`${BASE}/cancel-subscription`)
      .set(authHeader(token))
      .send({ subscriptionId: sub._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/already cancelled/i);
  });

  it('should return 404 when subscription does not belong to this user', async () => {
    const { userId } = await createAuthenticatedUser();
    const { token: otherToken } = await createAuthenticatedUser({ email: `other_${Date.now()}@test.com` });
    const sub = await createActiveSubscription(userId!);

    const res = await request(app)
      .post(`${BASE}/cancel-subscription`)
      .set(authHeader(otherToken))
      .send({ subscriptionId: sub._id.toString() });

    expect(res.status).toBe(404);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`${BASE}/cancel-subscription`)
      .send({ subscriptionId: 'any_id' });

    expect(res.status).toBe(401);
  });
});
