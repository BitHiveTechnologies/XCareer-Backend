/**
 * Integration Test — Full Payment Flow
 *
 * Tests the complete DB cycle:
 * Register → Create Order → Simulate Webhook → Verify /me subscriptionInfo
 */
import crypto from 'crypto';
import request from 'supertest';
import app from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections, authHeader } from '../helpers';
import { Subscription } from '../../models/Subscription';
import { User } from '../../models/User';

// Mock Cashfree external calls
jest.mock('../../utils/paymentService', () => {
  const actual = jest.requireActual('../../utils/paymentService');
  return {
    ...actual,
    createCashfreeOrder: jest.fn().mockImplementation(async (options) => ({
      success: true,
      order: {
        orderId: `int_order_${Date.now()}`,
        cfOrderId: 'int_cf_order',
        paymentSessionId: 'int_session',
        amount: options.amount,
        currency: 'INR',
        status: 'ACTIVE',
        orderMeta: {},
        customerDetails: { customer_email: options.customer?.email },
        createdAt: new Date().toISOString()
      }
    }))
  };
});

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  await clearCollections('users', 'userprofiles', 'subscriptions');
  jest.clearAllMocks();
});

const AUTH = '/api/v1/auth';
const PAYMENTS = '/api/v1/payments';
const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || 'test-webhook-secret';

function makeWebhookSig(body: string, ts: string) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${ts}.${body}`).digest('base64');
}

describe('Integration — Full Payment Flow', () => {
  it('should activate premium subscription end-to-end via webhook', async () => {
    // 1. Register user
    const regRes = await request(app)
      .post(`${AUTH}/register`)
      .send({ 
        email: 'int_flow@example.com', 
        password: 'TestPass123!', 
        name: 'Integration User',
        mobile: '9876543211',
        qualification: 'B.Tech',
        stream: 'IT',
        yearOfPassout: 2025,
        cgpaOrPercentage: 9.0
      });
    expect(regRes.status).toBe(201);
    const token = regRes.body.data.accessToken;

    // 2. Create payment order
    const orderRes = await request(app)
      .post(`${PAYMENTS}/create-order`)
      .set(authHeader(token))
      .send({ plan: 'premium', amount: 99 });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.order.id;

    // Verify subscription created in DB with CREATED status
    let sub = await Subscription.findOne({ orderId });
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe('pending');

    // 3. Simulate Cashfree SUCCESS webhook
    const webhookPayload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: orderId },
        payment: { cf_payment_id: 'int_pay_001', payment_status: 'SUCCESS', payment_amount: 99 }
      }
    });
    const ts = String(Date.now());
    const sig = makeWebhookSig(webhookPayload, ts);

    const whRes = await request(app)
      .post(`${PAYMENTS}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);
    expect(whRes.status).toBe(200);

    // 4. Verify subscription updated to completed
    sub = await Subscription.findOne({ orderId });
    expect(sub?.status).toBe('completed');

    // 5. Verify user plan updated
    const user = await User.findOne({ email: 'int_flow@example.com' });
    expect(user?.subscriptionPlan).toBe('premium');
    expect(user?.subscriptionStatus).toBe('active');

    // 6. Call /me and verify subscriptionInfo shows isActive=true
    const meRes = await request(app)
      .get(`${AUTH}/me`)
      .set(authHeader(token));
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.subscriptionInfo.isActive).toBe(true);
    expect(meRes.body.data.user.subscriptionInfo.daysRemaining).toBeGreaterThan(0);

    // 7. Verify payment history
    const histRes = await request(app)
      .get(`${PAYMENTS}/history`)
      .set(authHeader(token));
    expect(histRes.status).toBe(200);
    expect(histRes.body.data.subscriptions.length).toBeGreaterThanOrEqual(1);
  });

  it('should keep user inactive when payment fails', async () => {
    const regRes = await request(app)
      .post(`${AUTH}/register`)
      .send({ 
        email: 'fail_flow@example.com', 
        password: 'TestPass123!', 
        name: 'Fail User',
        mobile: '9876543212',
        qualification: 'M.Tech',
        stream: 'ECE',
        yearOfPassout: 2023,
        cgpaOrPercentage: 7.5
      });
    const token = regRes.body.data.accessToken;

    const orderRes = await request(app)
      .post(`${PAYMENTS}/create-order`)
      .set(authHeader(token))
      .send({ plan: 'basic', amount: 49 });
    const orderId = orderRes.body.data.order.id;

    // Simulate FAILED webhook
    const webhookPayload = JSON.stringify({
      type: 'PAYMENT_FAILED_WEBHOOK',
      data: {
        order: { order_id: orderId },
        payment: { cf_payment_id: 'int_pay_fail', payment_status: 'FAILED' }
      }
    });
    const ts = String(Date.now());
    const sig = makeWebhookSig(webhookPayload, ts);

    await request(app)
      .post(`${PAYMENTS}/webhook`)
      .set('x-webhook-signature', sig)
      .set('x-webhook-timestamp', ts)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    const meRes = await request(app).get(`${AUTH}/me`).set(authHeader(token));
    expect(meRes.body.data.user.subscriptionInfo.isActive).toBe(false);
  });
});

describe('Integration — Auth Lifecycle', () => {
  it('should complete the full register → login → change-password → re-login cycle', async () => {
    const email = 'lifecycle@example.com';
    const originalPwd = 'Original123!';
    const newPwd = 'Changed456!';

    // Register
    const regRes = await request(app)
      .post(`${AUTH}/register`)
      .send({ 
        email, 
        password: originalPwd, 
        name: 'Lifecycle User',
        mobile: '9876543213',
        qualification: 'B.E',
        stream: 'MECH',
        yearOfPassout: 2024,
        cgpaOrPercentage: 8.0
      });
    expect(regRes.status).toBe(201);
    const token = regRes.body.data.accessToken;

    // Login
    const loginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email, password: originalPwd });
    expect(loginRes.status).toBe(200);

    // Change password
    const changePwdRes = await request(app)
      .post(`${AUTH}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: originalPwd, newPassword: newPwd });
    expect(changePwdRes.status).toBe(200);

    // Old password rejected
    const oldLoginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email, password: originalPwd });
    expect(oldLoginRes.status).toBe(401);

    // New password accepted
    const newLoginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email, password: newPwd });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.accessToken).toBeDefined();
  });
});
