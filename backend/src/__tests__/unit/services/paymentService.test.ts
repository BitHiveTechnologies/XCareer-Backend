import {
  validateSubscriptionPlan,
  getPlanDetails,
  getAllPlans,
  calculateSubscriptionEndDate,
  getPlanPrice,
  verifyCashfreeWebhookSignature,
  generatePaymentReceipt,
  SUBSCRIPTION_PLANS
} from '../../../utils/paymentService';
import crypto from 'crypto';

const WEBHOOK_SECRET = 'test-webhook-secret';

beforeEach(() => {
  process.env.CASHFREE_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

describe('validateSubscriptionPlan', () => {
  it('should return true for valid plans', () => {
    expect(validateSubscriptionPlan('basic')).toBe(true);
    expect(validateSubscriptionPlan('premium')).toBe(true);
    expect(validateSubscriptionPlan('enterprise')).toBe(true);
  });

  it('should return false for invalid plans', () => {
    expect(validateSubscriptionPlan('gold')).toBe(false);
    expect(validateSubscriptionPlan('')).toBe(false);
    expect(validateSubscriptionPlan('PREMIUM')).toBe(false); // case-sensitive
  });
});

describe('getPlanDetails', () => {
  it('should return plan details for valid plans', () => {
    const basic = getPlanDetails('basic');
    expect(basic).not.toBeNull();
    expect(basic!.price).toBe(49);
    expect(basic!.duration).toBe(30);

    const premium = getPlanDetails('premium');
    expect(premium!.price).toBe(99);
    expect(premium!.duration).toBe(90);

    const enterprise = getPlanDetails('enterprise');
    expect(enterprise!.price).toBe(299);
    expect(enterprise!.duration).toBe(365);
  });

  it('should return null for invalid plan', () => {
    expect(getPlanDetails('invalid_plan')).toBeNull();
  });

  it('each plan should have features array', () => {
    for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});

describe('getAllPlans', () => {
  it('should return exactly 3 plans', () => {
    const plans = getAllPlans();
    expect(plans).toHaveLength(3);
  });

  it('should contain basic, premium, enterprise', () => {
    const ids = getAllPlans().map(p => p.id);
    expect(ids).toContain('basic');
    expect(ids).toContain('premium');
    expect(ids).toContain('enterprise');
  });
});

describe('calculateSubscriptionEndDate', () => {
  it('basic plan should end 30 days after start', () => {
    const start = new Date('2025-01-01');
    const end = calculateSubscriptionEndDate('basic', start);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(30);
  });

  it('premium plan should end 90 days after start', () => {
    const start = new Date('2025-01-01');
    const end = calculateSubscriptionEndDate('premium', start);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(90);
  });

  it('enterprise plan should end 365 days after start', () => {
    const start = new Date('2025-01-01');
    const end = calculateSubscriptionEndDate('enterprise', start);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(365);
  });

  it('should throw for an invalid plan', () => {
    expect(() => calculateSubscriptionEndDate('bogus')).toThrow(/invalid plan/i);
  });
});

describe('getPlanPrice', () => {
  it('should return correct INR prices', () => {
    expect(getPlanPrice('basic', 'INR')).toBe(49);
    expect(getPlanPrice('premium', 'INR')).toBe(99);
    expect(getPlanPrice('enterprise', 'INR')).toBe(299);
  });

  it('should throw for invalid plan', () => {
    expect(() => getPlanPrice('bogus')).toThrow(/invalid plan/i);
  });
});

describe('verifyCashfreeWebhookSignature', () => {
  function makeSignature(body: string, ts: string): string {
    return crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${ts}.${body}`)
      .digest('base64');
  }

  it('should return valid=true for a correct signature', () => {
    const body = JSON.stringify({ type: 'TEST' });
    const ts = String(Date.now());
    const sig = makeSignature(body, ts);
    const result = verifyCashfreeWebhookSignature(body, sig, ts);
    expect(result.valid).toBe(true);
  });

  it('should return valid=false for an incorrect signature', () => {
    const body = JSON.stringify({ type: 'TEST' });
    const ts = String(Date.now());
    const result = verifyCashfreeWebhookSignature(body, 'WRONG_SIGNATURE', ts);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('should return valid=false when signature is missing', () => {
    const result = verifyCashfreeWebhookSignature('body', undefined, '12345');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/missing/i);
  });

  it('should return valid=false when timestamp is missing', () => {
    const result = verifyCashfreeWebhookSignature('body', 'sig', undefined);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/missing/i);
  });
});

describe('generatePaymentReceipt', () => {
  it('should generate a receipt with all expected fields', () => {
    const receipt = generatePaymentReceipt({
      orderId: 'order_123',
      paymentId: 'pay_456',
      amount: 99,
      currency: 'INR',
      plan: 'premium',
      userId: 'user_789'
    });

    expect(receipt.receiptNumber).toMatch(/^RCP-/);
    expect(receipt.orderId).toBe('order_123');
    expect(receipt.status).toBe('completed');
    expect(receipt.amount).toBe(99);
    expect(receipt.timestamp).toBeDefined();
  });
});
