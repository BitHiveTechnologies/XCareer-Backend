import crypto from 'crypto';
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
import { User } from '../../../models/User';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  await clearCollections('users', 'userprofiles', 'subscriptions');
});

const BASE = '/api/v1/payments';
const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || 'test-webhook-secret';

function makeWebhookSignature(rawBody: string, timestamp: string): string {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('base64');
}

async function seedSubscription(orderId: string, userId?: string) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 90);

  return Subscription.create({
    userId,
    plan: 'premium',
    amount: 99,
    orderId,
    paymentId: 'test_wh_pay_id',
    status: 'pending',
    startDate: now,
    endDate
  });
}

describe('POST /payments/webhook', () => {
  it('should process a SUCCESS webhook and mark subscription as completed', async () => {
    const { userId } = await createAuthenticatedUser();
    const orderId = `order_wh_${Date.now()}`;
    await seedSubscription(orderId, userId);

    const payload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: orderId },
        payment: {
          cf_payment_id: 'cf_pay_001',
          payment_status: 'SUCCESS',
          payment_amount: 99
        }
      }
    });

    const ts = String(Date.now());
    const sig = makeWebhookSignature(payload, ts);

    const res = await request(app)
      .post(`${BASE}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const sub = await Subscription.findOne({ orderId });
    expect(sub?.status).toBe('completed');
  });

  it('should mark subscription as failed on FAILED webhook', async () => {
    const { userId } = await createAuthenticatedUser();
    const orderId = `order_wh_fail_${Date.now()}`;
    await seedSubscription(orderId, userId);

    const payload = JSON.stringify({
      type: 'PAYMENT_FAILED_WEBHOOK',
      data: {
        order: { order_id: orderId },
        payment: { cf_payment_id: 'cf_fail_001', payment_status: 'FAILED' }
      }
    });

    const ts = String(Date.now());
    const sig = makeWebhookSignature(payload, ts);

    await request(app)
      .post(`${BASE}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(payload);

    const sub = await Subscription.findOne({ orderId });
    expect(sub?.status).toBe('failed');
  });

  it('should return 400 when webhook signature is missing', async () => {
    const payload = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
    const res = await request(app)
      .post(`${BASE}/webhook`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when webhook signature is invalid', async () => {
    const payload = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'xyz' } } });
    const ts = String(Date.now());

    const res = await request(app)
      .post(`${BASE}/webhook`)
      .set('x-webhook-signature', 'BADINVALIDHASH')
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 and gracefully ignore unknown order IDs', async () => {
    const payload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: 'order_does_not_exist' },
        payment: { cf_payment_id: 'cf_unknown', payment_status: 'SUCCESS' }
      }
    });

    const ts = String(Date.now());
    const sig = makeWebhookSignature(payload, ts);

    const res = await request(app)
      .post(`${BASE}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/ignored/i);
  });

  it('should return 400 when orderId is missing from webhook payload', async () => {
    const payload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: { payment: { payment_status: 'SUCCESS' } }
    });

    const ts = String(Date.now());
    const sig = makeWebhookSignature(payload, ts);

    const res = await request(app)
      .post(`${BASE}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(400);
  });
});
