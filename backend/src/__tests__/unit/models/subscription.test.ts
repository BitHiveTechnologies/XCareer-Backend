import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB } from '../../helpers';
import { Subscription } from '../../../models/Subscription';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  const col = mongoose.connection.collections['subscriptions'];
  if (col) await col.deleteMany({});
});

function makeSubscription(overrides: Record<string, any> = {}) {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  return {
    plan: 'premium',
    amount: 99,
    orderId: `order_model_${Date.now()}`,
    paymentStatus: 'SUCCESS',
    status: 'completed',
    startDate: now,
    endDate,
    ...overrides
  };
}

describe('Subscription Model — instance methods', () => {
  it('isActive() should return true for completed subscription within dates', async () => {
    const sub = await Subscription.create(makeSubscription());
    expect((sub as any).isActive()).toBe(true);
  });

  it('isActive() should return false for pending subscription', async () => {
    const sub = await Subscription.create(makeSubscription({ status: 'pending', paymentStatus: 'CREATED' }));
    expect((sub as any).isActive()).toBe(false);
  });

  it('isActive() should return false for expired subscription', async () => {
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 100);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 10);

    const sub = await Subscription.create(makeSubscription({
      startDate: pastStart,
      endDate: pastEnd,
      status: 'expired'
    }));
    expect((sub as any).isActive()).toBe(false);
  });

  it('getDaysRemaining() should return a positive number for active subscription', async () => {
    const sub = await Subscription.create(makeSubscription());
    const days = (sub as any).getDaysRemaining();
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(90);
  });

  it('getDaysRemaining() should return 0 for inactive subscription', async () => {
    const sub = await Subscription.create(makeSubscription({ status: 'pending', paymentStatus: 'CREATED' }));
    expect((sub as any).getDaysRemaining()).toBe(0);
  });

  it('isExpiringSoon() should return true when endDate is within 7 days', async () => {
    const now = new Date();
    const soonEnd = new Date();
    soonEnd.setDate(soonEnd.getDate() + 3); // 3 days from now

    const sub = await Subscription.create(makeSubscription({ endDate: soonEnd }));
    expect((sub as any).isExpiringSoon()).toBe(true);
  });

  it('isExpiringSoon() should return false when endDate is far away', async () => {
    const sub = await Subscription.create(makeSubscription()); // 90 days
    expect((sub as any).isExpiringSoon()).toBe(false);
  });

  it('getPlanDisplay() should return human-readable plan name', async () => {
    const sub = await Subscription.create(makeSubscription({ plan: 'premium' }));
    expect((sub as any).getPlanDisplay()).toContain('Premium');
    expect((sub as any).getPlanDisplay()).toContain('₹99');
  });

  it('getTotalDuration() should return 90 days for premium plan', async () => {
    const sub = await Subscription.create(makeSubscription());
    expect((sub as any).getTotalDuration()).toBe(90);
  });
});

describe('Subscription Model — validation', () => {
  it('should reject amount that does not match plan (basic=49, premium=99, enterprise=299)', async () => {
    await expect(
      Subscription.create(makeSubscription({ plan: 'basic', amount: 999 }))
    ).rejects.toThrow();
  });

  it('should reject if endDate is before startDate', async () => {
    const start = new Date();
    const badEnd = new Date();
    badEnd.setDate(badEnd.getDate() - 5);

    await expect(
      Subscription.create(makeSubscription({ startDate: start, endDate: badEnd }))
    ).rejects.toThrow();
  });

  it('should reject invalid plan names', async () => {
    await expect(
      Subscription.create(makeSubscription({ plan: 'gold' }))
    ).rejects.toThrow();
  });

  it('should reject invalid status values', async () => {
    await expect(
      Subscription.create(makeSubscription({ status: 'unknown_status' }))
    ).rejects.toThrow();
  });

  it('should allow optional userId (for guest checkout)', async () => {
    const sub = await Subscription.create(makeSubscription({ userId: undefined }));
    expect(sub._id).toBeDefined();
  });
});

describe('Subscription Model — static methods', () => {
  it('findActiveSubscriptions() should return completed, within-date subs only', async () => {
    await Subscription.create(makeSubscription()); // active
    await Subscription.create(makeSubscription({ status: 'pending', paymentStatus: 'CREATED', orderId: `p_${Date.now()}` })); // pending

    const active = await (Subscription as any).findActiveSubscriptions();
    expect(active.length).toBe(1);
    expect(active[0].status).toBe('completed');
  });
});
