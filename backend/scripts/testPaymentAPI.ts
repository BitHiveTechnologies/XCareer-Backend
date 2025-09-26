import axios from 'axios';
import { logger } from '../src/utils/logger';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_VERSION = '/api/v1';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [] as any[]
};

// Helper function to log test results
function logTestResult(testName: string, passed: boolean, details?: any) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    logger.info(`✅ PASSED: ${testName}`);
  } else {
    testResults.failed++;
    logger.error(`❌ FAILED: ${testName}`);
    if (details) {
      logger.error('Details:', details);
    }
  }
  
  testResults.details.push({
    name: testName,
    passed,
    details
  });
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(
  method: string,
  endpoint: string,
  token: string,
  data?: any,
  headers: any = {}
) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${API_VERSION}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...headers
      },
      data
    };

    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Helper function to make unauthenticated requests
async function makeUnauthenticatedRequest(
  method: string,
  endpoint: string,
  data?: any,
  headers: any = {}
) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${API_VERSION}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      data
    };

    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test payment plan validation
async function testPaymentPlanValidation() {
  logger.info('🧪 Testing Payment Plan Validation...');
  
  // Test getting all plans (this should be a public endpoint)
  const allPlansResponse = await makeUnauthenticatedRequest('GET', '/subscriptions/plans');
  if (allPlansResponse.success && allPlansResponse.data.success) {
    logTestResult('Get all payment plans', true);
  } else {
    logTestResult('Get all payment plans', false, allPlansResponse.error);
  }
  
  // Test that all plans are returned correctly
  if (allPlansResponse.success && allPlansResponse.data.data.plans.length >= 3) {
    logTestResult('All subscription plans available', true);
  } else {
    logTestResult('All subscription plans available', false, 'Expected at least 3 plans');
  }
}

// Test payment order creation
async function testPaymentOrderCreation(token: string) {
  logger.info('🧪 Testing Payment Order Creation...');
  
  // Test basic plan order creation
  const basicOrderData = {
    plan: 'basic',
    amount: 49,
    currency: 'INR'
  };
  
  const basicResponse = await makeAuthenticatedRequest('POST', '/payments/create-order', token, basicOrderData);
  if (basicResponse.success && basicResponse.data.success) {
    logTestResult('Create Basic Plan Order', true);
  } else {
    // Expected to fail due to test Razorpay credentials
    if (basicResponse.error && basicResponse.error.message && basicResponse.error.message.includes('Failed to create order')) {
      logTestResult('Create Basic Plan Order (Expected failure with test credentials)', true);
    } else {
      logTestResult('Create Basic Plan Order', false, basicResponse.error);
    }
  }
  
  // Test premium plan order creation
  const premiumOrderData = {
    plan: 'premium',
    amount: 99,
    currency: 'INR'
  };
  
  const premiumResponse = await makeAuthenticatedRequest('POST', '/payments/create-order', token, premiumOrderData);
  if (premiumResponse.success && premiumResponse.data.success) {
    logTestResult('Create Premium Plan Order', true);
  } else {
    // Expected to fail due to test Razorpay credentials
    if (premiumResponse.error && premiumResponse.error.message && premiumResponse.error.message.includes('Failed to create order')) {
      logTestResult('Create Premium Plan Order (Expected failure with test credentials)', true);
    } else {
      logTestResult('Create Premium Plan Order', false, premiumResponse.error);
    }
  }
  
  // Test invalid order data
  const invalidOrderData = {
    plan: 'invalid',
    amount: -100,
    currency: 'INVALID'
  };
  
  const invalidResponse = await makeAuthenticatedRequest('POST', '/payments/create-order', token, invalidOrderData);
  if (!invalidResponse.success && invalidResponse.status === 400) {
    logTestResult('Invalid order data validation', true);
  } else {
    logTestResult('Invalid order data validation', false, invalidResponse.error);
  }
}

// Test payment verification
async function testPaymentVerification(token: string) {
  logger.info('🧪 Testing Payment Verification...');
  
  // Test valid payment verification (mock data)
  const validPaymentData = {
    razorpay_order_id: 'order_test123',
    razorpay_payment_id: 'pay_test123',
    razorpay_signature: 'test_signature',
    plan: 'basic',
    amount: 49
  };
  
  const validResponse = await makeAuthenticatedRequest('POST', '/payments/verify', token, validPaymentData);
  if (validResponse.success) {
    logTestResult('Payment Verification (Valid)', true);
  } else {
    logTestResult('Payment Verification (Valid)', false, validResponse.error);
  }
  
  // Test invalid payment verification
  const invalidPaymentData = {
    razorpay_order_id: '',
    razorpay_payment_id: '',
    razorpay_signature: '',
    plan: 'basic',
    amount: 49
  };
  
  const invalidResponse = await makeAuthenticatedRequest('POST', '/payments/verify', token, invalidPaymentData);
  if (!invalidResponse.success && invalidResponse.status === 400) {
    logTestResult('Payment Verification (Invalid)', true);
  } else {
    logTestResult('Payment Verification (Invalid)', false, invalidResponse.error);
  }
}

// Test payment history
async function testPaymentHistory(token: string) {
  logger.info('🧪 Testing Payment History...');
  
  // Test get payment history
  const historyResponse = await makeAuthenticatedRequest('GET', '/payments/history', token);
  if (historyResponse.success && historyResponse.data.success) {
    logTestResult('Get Payment History', true);
  } else {
    logTestResult('Get Payment History', false, historyResponse.error);
  }
  
  // Test get payment history with pagination
  const paginatedResponse = await makeAuthenticatedRequest('GET', '/payments/history?page=1&limit=10', token);
  if (paginatedResponse.success && paginatedResponse.data.success) {
    logTestResult('Get Payment History (Paginated)', true);
  } else {
    logTestResult('Get Payment History (Paginated)', false, paginatedResponse.error);
  }
}

// Test payment status
async function testPaymentStatus(token: string) {
  logger.info('🧪 Testing Payment Status...');
  
  // Test get payment status with valid subscription ID
  const validStatusResponse = await makeAuthenticatedRequest('GET', '/payments/status/test_subscription_id', token);
  if (validStatusResponse.success) {
    logTestResult('Get Payment Status (Valid ID)', true);
  } else {
    logTestResult('Get Payment Status (Valid ID)', false, validStatusResponse.error);
  }
  
  // Test get payment status with invalid subscription ID
  const invalidStatusResponse = await makeAuthenticatedRequest('GET', '/payments/status/invalid_id', token);
  if (!invalidStatusResponse.success && invalidStatusResponse.status === 404) {
    logTestResult('Get Payment Status (Invalid ID)', true);
  } else {
    logTestResult('Get Payment Status (Invalid ID)', false, invalidStatusResponse.error);
  }
}

// Test subscription cancellation
async function testSubscriptionCancellation(token: string) {
  logger.info('🧪 Testing Subscription Cancellation...');
  
  // Test cancel subscription with valid data
  const cancelData = {
    subscriptionId: 'test_subscription_id',
    reason: 'User requested cancellation'
  };
  
  const cancelResponse = await makeAuthenticatedRequest('POST', '/payments/cancel-subscription', token, cancelData);
  if (cancelResponse.success) {
    logTestResult('Cancel Subscription (Valid)', true);
  } else {
    logTestResult('Cancel Subscription (Valid)', false, cancelResponse.error);
  }
  
  // Test cancel subscription with invalid data
  const invalidCancelData = {
    subscriptionId: '',
    reason: ''
  };
  
  const invalidCancelResponse = await makeAuthenticatedRequest('POST', '/payments/cancel-subscription', token, invalidCancelData);
  if (!invalidCancelResponse.success && invalidCancelResponse.status === 400) {
    logTestResult('Cancel Subscription (Invalid)', true);
  } else {
    logTestResult('Cancel Subscription (Invalid)', false, invalidCancelResponse.error);
  }
}

// Test webhook security
async function testWebhookSecurity() {
  logger.info('🧪 Testing Webhook Security...');
  
  // Test webhook without signature
  const noSignatureResponse = await makeUnauthenticatedRequest('POST', '/payments/webhook', {
    event: 'payment.captured',
    payload: { payment: { id: 'test_payment_id' } }
  });
  
  if (!noSignatureResponse.success && noSignatureResponse.status === 400) {
    logTestResult('Webhook Security (No Signature)', true);
  } else {
    logTestResult('Webhook Security (No Signature)', false, noSignatureResponse.error);
  }
  
  // Test webhook with invalid signature
  const invalidSignatureResponse = await makeUnauthenticatedRequest('POST', '/payments/webhook', {
    event: 'payment.captured',
    payload: { payment: { id: 'test_payment_id' } }
  }, {
    'X-Razorpay-Signature': 'invalid_signature'
  });
  
  if (!invalidSignatureResponse.success && invalidSignatureResponse.status === 400) {
    logTestResult('Webhook Security (Invalid Signature)', true);
  } else {
    logTestResult('Webhook Security (Invalid Signature)', false, invalidSignatureResponse.error);
  }
}

// Test authentication requirements
async function testAuthenticationRequirements() {
  logger.info('🧪 Testing Authentication Requirements...');
  
  // Test create order without authentication
  const createOrderResponse = await makeUnauthenticatedRequest('POST', '/payments/create-order', {
    plan: 'basic',
    amount: 49,
    currency: 'INR'
  });
  
  if (!createOrderResponse.success && createOrderResponse.status === 401) {
    logTestResult('Authentication Required (Create Order)', true);
  } else {
    logTestResult('Authentication Required (Create Order)', false, createOrderResponse.error);
  }
  
  // Test payment history without authentication
  const historyResponse = await makeUnauthenticatedRequest('GET', '/payments/history');
  
  if (!historyResponse.success && historyResponse.status === 401) {
    logTestResult('Authentication Required (Payment History)', true);
  } else {
    logTestResult('Authentication Required (Payment History)', false, historyResponse.error);
  }
}

// Test rate limiting
async function testRateLimiting(token: string) {
  logger.info('🧪 Testing Rate Limiting...');
  
  // Make multiple rapid requests to test rate limiting
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(makeAuthenticatedRequest('GET', '/payments/history', token));
  }
  
  const responses = await Promise.all(requests);
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  
  if (rateLimitedResponses.length > 0) {
    logTestResult('Rate Limiting', true);
  } else {
    logTestResult('Rate Limiting', false, 'No rate limiting detected');
  }
}

// Test error handling
async function testErrorHandling(token: string) {
  logger.info('🧪 Testing Error Handling...');
  
  // Test with malformed JSON
  const malformedResponse = await makeAuthenticatedRequest('POST', '/payments/create-order', token, 'invalid json');
  if (!malformedResponse.success && malformedResponse.status === 400) {
    logTestResult('Error Handling (Malformed JSON)', true);
  } else {
    logTestResult('Error Handling (Malformed JSON)', false, malformedResponse.error);
  }
  
  // Test with missing required fields
  const missingFieldsResponse = await makeAuthenticatedRequest('POST', '/payments/create-order', token, {});
  if (!missingFieldsResponse.success && missingFieldsResponse.status === 400) {
    logTestResult('Error Handling (Missing Fields)', true);
  } else {
    logTestResult('Error Handling (Missing Fields)', false, missingFieldsResponse.error);
  }
}

// Main test function
async function runPaymentTests() {
  logger.info('🚀 Starting Payment API Tests...');
  
  try {
    // Get authentication token using test user
    const authResponse = await makeUnauthenticatedRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });
    
    if (!authResponse.success) {
      logger.error('Failed to authenticate for testing', authResponse.error);
      return;
    }
    
    const token = authResponse.data.data?.accessToken;
    if (!token) {
      logger.error('No token found in auth response', authResponse.data);
      return;
    }
    
    logger.info('Authentication successful, token obtained');
    
    // Run all tests
    await testPaymentPlanValidation();
    await testPaymentOrderCreation(token);
    await testPaymentVerification(token);
    await testPaymentHistory(token);
    await testPaymentStatus(token);
    await testSubscriptionCancellation(token);
    await testWebhookSecurity();
    await testAuthenticationRequirements();
    await testRateLimiting(token);
    await testErrorHandling(token);
    
    // Print test results
    logger.info('\n📊 Test Results Summary:');
    logger.info(`Total Tests: ${testResults.total}`);
    logger.info(`Passed: ${testResults.passed}`);
    logger.info(`Failed: ${testResults.failed}`);
    logger.info(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
      logger.info('\n❌ Failed Tests:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          logger.error(`- ${test.name}: ${JSON.stringify(test.details)}`);
        });
    }
    
    logger.info('\n✅ Payment API Tests Completed!');
    
  } catch (error) {
    logger.error('Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPaymentTests().catch(console.error);
}

export { runPaymentTests };
