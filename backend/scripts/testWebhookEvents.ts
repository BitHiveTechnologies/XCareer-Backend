#!/usr/bin/env ts-node

/**
 * Comprehensive Webhook Events Test Suite
 * 
 * This script tests subscription webhook handling for Cashfree notifications
 * to ensure proper handling of payment lifecycle management.
 */

import axios from 'axios';
import crypto from 'crypto';
import { config } from '../src/config/environment';
import { logger } from '../src/utils/logger';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const WEBHOOK_SECRET = config.CASHFREE_WEBHOOK_SECRET || 'default_webhook_secret';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
};

// Helper function for logging test results
const logTestResult = (testName: string, passed: boolean, error?: any, details?: string) => {
  if (passed) {
    logger.info(`✅ ${testName} | ${details || ''}`);
    testResults.passed++;
  } else {
    logger.error(`❌ ${testName} | ${error ? JSON.stringify(error) : 'No details'} ${details || ''}`);
    testResults.failed++;
  }
};

// Helper function to create webhook signature
const createWebhookSignature = (payload: any): string => {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('base64');
};

// Helper function to send webhook request
const sendWebhookRequest = async (event: string, payload: any) => {
  const webhookPayload = { event, payload };
  const signature = createWebhookSignature(webhookPayload);

  try {
    const response = await axios.post(`${BASE_URL}/api/v1/payments/webhook`, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': Date.now().toString()
      }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

// Test payment captured webhook
async function testPaymentCapturedWebhook() {
  logger.info('🧪 Testing Payment Captured Webhook...');

  const payload = {
    payment: {
      entity: {
        id: 'pay_test_123',
        amount: 4900,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_test_123',
        method: 'card',
        description: 'Test payment for basic plan',
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('payment.captured', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Payment Captured Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Payment Captured Webhook', false, response.error);
  }
}

// Test payment failed webhook
async function testPaymentFailedWebhook() {
  logger.info('🧪 Testing Payment Failed Webhook...');

  const payload = {
    payment: {
      entity: {
        id: 'pay_test_456',
        amount: 4900,
        currency: 'INR',
        status: 'failed',
        order_id: 'order_test_456',
        method: 'card',
        description: 'Test failed payment',
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('payment.failed', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Payment Failed Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Payment Failed Webhook', false, response.error);
  }
}

// Test refund processed webhook
async function testRefundProcessedWebhook() {
  logger.info('🧪 Testing Refund Processed Webhook...');

  const payload = {
    refund: {
      entity: {
        id: 'rfnd_test_123',
        payment_id: 'pay_test_123',
        amount: 4900,
        currency: 'INR',
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('refund.processed', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Refund Processed Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Refund Processed Webhook', false, response.error);
  }
}

// Test subscription activated webhook
async function testSubscriptionActivatedWebhook() {
  logger.info('🧪 Testing Subscription Activated Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_123',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_basic',
        status: 'active',
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.activated', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Activated Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Activated Webhook', false, response.error);
  }
}

// Test subscription charged webhook
async function testSubscriptionChargedWebhook() {
  logger.info('🧪 Testing Subscription Charged Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_456',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_premium',
        status: 'active',
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor(Date.now() / 1000)
      }
    },
    payment: {
      entity: {
        id: 'pay_recurring_123',
        amount: 9900,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.charged', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Charged Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Charged Webhook', false, response.error);
  }
}

// Test subscription completed webhook
async function testSubscriptionCompletedWebhook() {
  logger.info('🧪 Testing Subscription Completed Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_789',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_enterprise',
        status: 'completed',
        current_start: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000),
        current_end: Math.floor(Date.now() / 1000),
        created_at: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.completed', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Completed Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Completed Webhook', false, response.error);
  }
}

// Test subscription cancelled webhook
async function testSubscriptionCancelledWebhook() {
  logger.info('🧪 Testing Subscription Cancelled Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_101',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_basic',
        status: 'cancelled',
        cancelled_at: Math.floor(Date.now() / 1000),
        current_start: Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000),
        current_end: Math.floor((Date.now() + 15 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.cancelled', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Cancelled Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Cancelled Webhook', false, response.error);
  }
}

// Test subscription paused webhook
async function testSubscriptionPausedWebhook() {
  logger.info('🧪 Testing Subscription Paused Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_202',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_premium',
        status: 'paused',
        paused_at: Math.floor(Date.now() / 1000),
        current_start: Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000),
        current_end: Math.floor((Date.now() + 80 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.paused', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Paused Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Paused Webhook', false, response.error);
  }
}

// Test subscription resumed webhook
async function testSubscriptionResumedWebhook() {
  logger.info('🧪 Testing Subscription Resumed Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_303',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_premium',
        status: 'active',
        resumed_at: Math.floor(Date.now() / 1000),
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 80 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.resumed', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Resumed Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Resumed Webhook', false, response.error);
  }
}

// Test subscription halted webhook
async function testSubscriptionHaltedWebhook() {
  logger.info('🧪 Testing Subscription Halted Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_404',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_enterprise',
        status: 'halted',
        halted_at: Math.floor(Date.now() / 1000),
        current_start: Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000),
        current_end: Math.floor((Date.now() + 360 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.halted', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Halted Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Halted Webhook', false, response.error);
  }
}

// Test subscription updated webhook
async function testSubscriptionUpdatedWebhook() {
  logger.info('🧪 Testing Subscription Updated Webhook...');

  const payload = {
    subscription: {
      entity: {
        id: 'sub_test_505',
        customer_id: 'john.doe@example.com',
        plan_id: 'plan_premium',
        status: 'active',
        updated_at: Math.floor(Date.now() / 1000),
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000),
        created_at: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
      }
    }
  };

  const response = await sendWebhookRequest('subscription.updated', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Subscription Updated Webhook', true, null, 'Webhook processed successfully');
  } else {
    logTestResult('Subscription Updated Webhook', false, response.error);
  }
}

// Test webhook signature validation
async function testWebhookSignatureValidation() {
  logger.info('🧪 Testing Webhook Signature Validation...');

  const payload = { event: 'test.event', payload: { test: 'data' } };
  
  // Test with invalid signature
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/payments/webhook`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature'
      }
    });
    
    if (response.status === 400) {
      logTestResult('Invalid Signature Rejection', true, null, 'Correctly rejected invalid signature');
    } else {
      logTestResult('Invalid Signature Rejection', false, null, 'Should have rejected invalid signature');
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      logTestResult('Invalid Signature Rejection', true, null, 'Correctly rejected invalid signature');
    } else {
      logTestResult('Invalid Signature Rejection', false, error.response?.data);
    }
  }

  // Test with missing signature
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/payments/webhook`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 400) {
      logTestResult('Missing Signature Rejection', true, null, 'Correctly rejected missing signature');
    } else {
      logTestResult('Missing Signature Rejection', false, null, 'Should have rejected missing signature');
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      logTestResult('Missing Signature Rejection', true, null, 'Correctly rejected missing signature');
    } else {
      logTestResult('Missing Signature Rejection', false, error.response?.data);
    }
  }
}

// Test unhandled webhook events
async function testUnhandledWebhookEvents() {
  logger.info('🧪 Testing Unhandled Webhook Events...');

  const payload = {
    test: {
      entity: {
        id: 'test_123',
        data: 'test_data'
      }
    }
  };

  const response = await sendWebhookRequest('unknown.event', payload);
  
  if (response.success && response.status === 200) {
    logTestResult('Unhandled Event Processing', true, null, 'Webhook processed unhandled event gracefully');
  } else {
    logTestResult('Unhandled Event Processing', false, response.error);
  }
}

// Main test function
async function runWebhookTests() {
  logger.info('🚀 Starting Comprehensive Webhook Events Test Suite...');

  try {
    await testPaymentCapturedWebhook();
    await testPaymentFailedWebhook();
    await testRefundProcessedWebhook();
    await testSubscriptionActivatedWebhook();
    await testSubscriptionChargedWebhook();
    await testSubscriptionCompletedWebhook();
    await testSubscriptionCancelledWebhook();
    await testSubscriptionPausedWebhook();
    await testSubscriptionResumedWebhook();
    await testSubscriptionHaltedWebhook();
    await testSubscriptionUpdatedWebhook();
    await testWebhookSignatureValidation();
    await testUnhandledWebhookEvents();
  } finally {
    logger.info('\n📊 Webhook Test Results Summary:');
    logger.info(`Total Tests: ${testResults.passed + testResults.failed}`);
    logger.info(`Passed: ${testResults.passed}`);
    logger.info(`Failed: ${testResults.failed}`);
    logger.info(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
      logger.warn(`⚠️  ${testResults.failed} tests failed. Please review the errors above.`);
    } else {
      logger.info('🎉 All webhook tests passed successfully!');
    }
  }
}

// Run the tests
runWebhookTests().catch((error) => {
  logger.error('Webhook test suite failed:', error);
  process.exit(1);
});
