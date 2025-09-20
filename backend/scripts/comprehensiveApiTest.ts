import axios from 'axios';
import { logger } from '../src/utils/logger';
import { config } from '../src/config/environment';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
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
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  logger.info('\n🧪 Testing Health Check...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logTestResult('Health Check', true, response.data);
    } else {
      logTestResult('Health Check', false, response.data);
    }
  } catch (error: any) {
    logTestResult('Health Check', false, error.response?.data || error.message);
  }
}

// Test 2: Legacy JWT Authentication
async function testLegacyJWTAuth() {
  logger.info('\n🧪 Testing Legacy JWT Authentication...');
  
  // Test user registration
  try {
    const registerResponse = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      mobile: '9876543210',
      qualification: 'B.Tech',
      stream: 'CSE',
      yearOfPassout: 2023,
      cgpaOrPercentage: 8.5
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      logTestResult('User Registration (JWT)', true);
    } else {
      logTestResult('User Registration (JWT)', false, registerResponse.data);
    }
  } catch (error: any) {
    if (error.response?.status === 409) {
      logTestResult('User Registration (JWT)', true, 'User already exists');
    } else {
      logTestResult('User Registration (JWT)', false, error.response?.data || error.message);
    }
  }
  
  // Test user login with seeded user
  let jwtToken = null;
  try {
    const loginResponse = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      jwtToken = loginResponse.data.data.token;
      logTestResult('User Login (JWT)', true);
      logger.info(`JWT Token: ${jwtToken.substring(0, 50)}...`);
    } else {
      logTestResult('User Login (JWT)', false, loginResponse.data);
    }
  } catch (error: any) {
    logTestResult('User Login (JWT)', false, error.response?.data || error.message);
  }
  
  return jwtToken;
}

// Test 3: Admin JWT Authentication
async function testAdminJWTAuth() {
  logger.info('\n🧪 Testing Admin JWT Authentication...');
  
  // Test admin login with seeded admin
  try {
    const response = await axios.post(`${BASE_URL}${API_VERSION}/admin/login`, {
      email: 'admin@notifyx.com',
      password: 'Admin123!'
    });
    
    if (response.status === 200 && response.data.success) {
      logTestResult('Admin Login (JWT)', true);
      return response.data.data.token;
    } else {
      logTestResult('Admin Login (JWT)', false, response.data);
      return null;
    }
  } catch (error: any) {
    logTestResult('Admin Login (JWT)', false, error.response?.data || error.message);
    return null;
  }
}

// Test 4: Clerk Authentication (Mock)
async function testClerkAuth() {
  logger.info('\n🧪 Testing Clerk Authentication...');
  
  // Check if Clerk is properly configured
  if (!config.CLERK_SECRET_KEY || config.CLERK_SECRET_KEY === '') {
    logTestResult('Clerk Configuration', false, 'Clerk not configured - missing CLERK_SECRET_KEY');
    return null;
  }
  
  logTestResult('Clerk Configuration', true, 'Clerk is configured');
  
  // Note: For actual Clerk testing, you would need:
  // 1. A frontend application with Clerk
  // 2. A valid Clerk session token
  // 3. The token would be obtained from the frontend after user signs in
  
  logger.info('📝 Note: To test Clerk authentication, you need:');
  logger.info('1. A frontend application with Clerk integration');
  logger.info('2. User to sign in through Clerk');
  logger.info('3. Use the session token from Clerk in Authorization header');
  logger.info('4. Example: Authorization: Bearer <clerk-session-token>');
  
  return null;
}

// Test 5: API Endpoints with JWT Token
async function testApiEndpoints(jwtToken: string, adminToken: string) {
  logger.info('\n🧪 Testing API Endpoints...');
  
  if (!jwtToken) {
    logTestResult('API Testing', false, 'No JWT token available');
    return;
  }
  
  // Test user profile
  const profileResponse = await makeAuthenticatedRequest('GET', '/auth/me', jwtToken);
  if (profileResponse.success && profileResponse.data.success) {
    logTestResult('Get User Profile', true);
  } else {
    logTestResult('Get User Profile', false, profileResponse.error);
  }
  
  // Test jobs listing
  const jobsResponse = await makeAuthenticatedRequest('GET', '/jobs?limit=10', jwtToken);
  if (jobsResponse.success && jobsResponse.data.success) {
    logTestResult('Get Jobs List', true);
  } else {
    logTestResult('Get Jobs List', false, jobsResponse.error);
  }
  
  // Test subscriptions
  const subscriptionsResponse = await makeAuthenticatedRequest('GET', '/subscriptions', jwtToken);
  if (subscriptionsResponse.success && subscriptionsResponse.data.success) {
    logTestResult('Get User Subscriptions', true);
  } else {
    logTestResult('Get User Subscriptions', false, subscriptionsResponse.error);
  }
  
  // Test notifications
  const notificationsResponse = await makeAuthenticatedRequest('GET', '/notifications', jwtToken);
  if (notificationsResponse.success && notificationsResponse.data.success) {
    logTestResult('Get User Notifications', true);
  } else {
    logTestResult('Get User Notifications', false, notificationsResponse.error);
  }
}

// Test 6: Admin API Endpoints
async function testAdminApiEndpoints(adminToken: string) {
  logger.info('\n🧪 Testing Admin API Endpoints...');
  
  if (!adminToken) {
    logTestResult('Admin API Testing', false, 'No admin token available');
    return;
  }
  
  // Test admin dashboard
  const dashboardResponse = await makeAuthenticatedRequest('GET', '/admin/dashboard/stats', adminToken);
  if (dashboardResponse.success && dashboardResponse.data.success) {
    logTestResult('Admin Dashboard Stats', true);
  } else {
    logTestResult('Admin Dashboard Stats', false, dashboardResponse.error);
  }
  
  // Test users management
  const usersResponse = await makeAuthenticatedRequest('GET', '/admin/users?limit=10', adminToken);
  if (usersResponse.success && usersResponse.data.success) {
    logTestResult('Admin Get Users', true);
  } else {
    logTestResult('Admin Get Users', false, usersResponse.error);
  }
  
  // Test jobs management
  const jobsResponse = await makeAuthenticatedRequest('GET', '/admin/jobs?limit=10', adminToken);
  if (jobsResponse.success && jobsResponse.data.success) {
    logTestResult('Admin Get Jobs', true);
  } else {
    logTestResult('Admin Get Jobs', false, jobsResponse.error);
  }
  
  // Test subscriptions management
  const subscriptionsResponse = await makeAuthenticatedRequest('GET', '/admin/subscriptions?limit=10', adminToken);
  if (subscriptionsResponse.success && subscriptionsResponse.data.success) {
    logTestResult('Admin Get Subscriptions', true);
  } else {
    logTestResult('Admin Get Subscriptions', false, subscriptionsResponse.error);
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  logger.info('\n🧪 Testing Error Handling...');
  
  // Test invalid endpoint
  try {
    await axios.get(`${BASE_URL}${API_VERSION}/invalid-endpoint`);
    logTestResult('Invalid Endpoint', false, 'Should return 404');
  } catch (error: any) {
    if (error.response?.status === 404) {
      logTestResult('Invalid Endpoint', true);
    } else {
      logTestResult('Invalid Endpoint', false, error.response?.data || error.message);
    }
  }
  
  // Test unauthorized access
  try {
    await axios.get(`${BASE_URL}${API_VERSION}/auth/me`);
    logTestResult('Unauthorized Access', false, 'Should return 401');
  } catch (error: any) {
    if (error.response?.status === 401) {
      logTestResult('Unauthorized Access', true);
    } else {
      logTestResult('Unauthorized Access', false, error.response?.data || error.message);
    }
  }
}

// Main test function
async function runComprehensiveTests() {
  logger.info('🚀 Starting Comprehensive API Tests...');
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info(`API Version: ${API_VERSION}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  
  try {
    // Test 1: Health Check
    await testHealthCheck();
    
    // Test 2: Legacy JWT Authentication
    const jwtToken = await testLegacyJWTAuth();
    
    // Test 3: Admin JWT Authentication
    const adminToken = await testAdminJWTAuth();
    
    // Test 4: Clerk Authentication
    await testClerkAuth();
    
    // Test 5: API Endpoints
    await testApiEndpoints(jwtToken, adminToken);
    
    // Test 6: Admin API Endpoints
    await testAdminApiEndpoints(adminToken);
    
    // Test 7: Error Handling
    await testErrorHandling();
    
    // Print test summary
    logger.info('\n📊 Test Results Summary');
    logger.info(`Total Tests: ${testResults.total}`);
    logger.info(`Passed: ${testResults.passed}`);
    logger.info(`Failed: ${testResults.failed}`);
    logger.info(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.failed > 0) {
      logger.error('\n❌ Failed Tests:');
      testResults.details
        .filter(result => !result.passed)
        .forEach(result => {
          logger.error(`- ${result.name}`);
        });
    }
    
    if (testResults.passed === testResults.total) {
      logger.info('\n🎉 All tests passed! API is working correctly.');
    } else {
      logger.warn('\n⚠️  Some tests failed. Please check the details above.');
    }
    
    // Display tokens for manual testing
    if (jwtToken) {
      logger.info('\n🔑 JWT Token for Manual Testing:');
      logger.info(`Bearer ${jwtToken}`);
    }
    
    if (adminToken) {
      logger.info('\n🔑 Admin JWT Token for Manual Testing:');
      logger.info(`Bearer ${adminToken}`);
    }
    
  } catch (error) {
    logger.error('❌ Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests()
    .then(() => {
      logger.info('Test execution completed');
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveTests, testResults };


