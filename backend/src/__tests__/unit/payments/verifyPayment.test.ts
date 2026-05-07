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

// ─── Mock external Cashfree calls ────────────────────────────────────────────
jest.mock('../../../utils/paymentService', () => {
  const actual = jest.requireActual('../../../utils/paymentService');
  return {
    ...actual,
    createCashfreeOrder: jest.fn().mockResolvedValue({
      success: true,
      order: {
        orderId: 'test_order_verify',
        cfOrderId: 'cf_verify_123',
        paymentSessionId: 'session_verify_123',
        amount: 99,
        currency: 'INR',
        status: 'ACTIVE',
        orderMeta: {},
        customerDetails: {},
        createdAt: new Date().toISOString()
      }
    }),
    fetchCashfreeOrderPayments: jest.fn()
  };
});

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  await clearCollections('users', 'userprofiles', 'subscriptions');
  jest.clearAllMocks();
});

const BASE = '/api/v1/payments';

describe('POST /payments/verify', () => {
  async function createOrderAndGetDetails() {
    const { token, userId } = await createAuthenticatedUser();
    // First create order
    const orderRes = await request(app)
      .post(`${BASE}/create-order`)
      .set(authHeader(token))
      .send({ plan: 'premium', amount: 99 });

    const orderId = orderRes.body.data?.order?.id;
    return { token, userId, orderId };
  }

  it('should mark subscription as completed when payment SUCCESS', async () => {
    const { fetchCashfreeOrderPayments } = await import('../../../utils/paymentService') as any;
    fetchCashfreeOrderPayments.mockResolvedValueOnce({
      success: true,
      payments: [{
        cf_payment_id: 'pay_success_001',
        payment_status: 'SUCCESS',
        payment_amount: 99,
        payment_currency: 'INR',
        payment_time: new Date().toISOString()
      }]
    });

    const { token, orderId } = await createOrderAndGetDetails();
    const res = await request(app)
      .post(`${BASE}/verify`)
      .set(authHeader(token))
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.subscription.isActive).toBe(true);
  });

  it('should return status=failed when payment FAILED', async () => {
    const { fetchCashfreeOrderPayments } = await import('../../../utils/paymentService') as any;
    fetchCashfreeOrderPayments.mockResolvedValueOnce({
      success: true,
      payments: [{
        cf_payment_id: 'pay_fail_001',
        payment_status: 'FAILED',
        payment_amount: 99
      }]
    });

    const { token, orderId } = await createOrderAndGetDetails();
    const res = await request(app)
      .post(`${BASE}/verify`)
      .set(authHeader(token))
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('failed');
  });

  it('should return status=failed when payment USER_DROPPED', async () => {
    const { fetchCashfreeOrderPayments } = await import('../../../utils/paymentService') as any;
    fetchCashfreeOrderPayments.mockResolvedValueOnce({
      success: true,
      payments: [{
        cf_payment_id: 'pay_drop_001',
        payment_status: 'USER_DROPPED'
      }]
    });

    const { token, orderId } = await createOrderAndGetDetails();
    const res = await request(app)
      .post(`${BASE}/verify`)
      .set(authHeader(token))
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('failed');
  });

  it('should return 400 when orderId is missing', async () => {
    const { token } = await createAuthenticatedUser();
    const res = await request(app)
      .post(`${BASE}/verify`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`${BASE}/verify`)
      .send({ orderId: 'some_order' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should update User.subscriptionPlan to premium on SUCCESS', async () => {
    const { fetchCashfreeOrderPayments } = await import('../../../utils/paymentService') as any;
    fetchCashfreeOrderPayments.mockResolvedValueOnce({
      success: true,
      payments: [{
        cf_payment_id: 'pay_plan_001',
        payment_status: 'SUCCESS',
        payment_amount: 99
      }]
    });

    const { token, userId, orderId } = await createOrderAndGetDetails();
    await request(app)
      .post(`${BASE}/verify`)
      .set(authHeader(token))
      .send({ orderId });

    const user = await User.findById(userId);
    expect(user?.subscriptionPlan).toBe('premium');
    expect(user?.subscriptionStatus).toBe('active');
  });
});
