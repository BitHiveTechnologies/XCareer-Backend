#!/usr/bin/env ts-node

/**
 * Comprehensive Test Suite for User Provisioning System
 *
 * This script tests all aspects of the automated user provisioning system including:
 * - Single user provisioning
 * - Bulk user provisioning
 * - External system integration (Razorpay, Clerk, CSV)
 * - User profile creation
 * - Subscription management
 * - Statistics and monitoring
 */

import axios from 'axios';
import { logger } from '../src/utils/logger';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

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

// Helper to make authenticated requests
const makeAuthenticatedRequest = async (method: string, url: string, data?: any, token?: string) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    return { success: true, status: response.status, data: response.data };
  } catch (error: any) {
    return { success: false, status: error.response?.status, error: error.response?.data || error.message };
  }
};

// Helper to make unauthenticated requests
const makeUnauthenticatedRequest = async (method: string, url: string, data?: any) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return { success: true, status: response.status, data: response.data };
  } catch (error: any) {
    return { success: false, status: error.response?.status, error: error.response?.data || error.message };
  }
};

// Get admin authentication token
async function getAdminToken(): Promise<string | null> {
  try {
    // First try to login with existing admin
    let response = await makeUnauthenticatedRequest('POST', '/api/v1/auth/login', {
      email: 'admin@notifyx.com',
      password: 'Admin123!'
    });

    if (response.success && response.data?.data?.accessToken) {
      return response.data.data.accessToken;
    }

    // If admin doesn't exist, try to create one
    logger.info('Admin user not found, attempting to create one...');
    response = await makeUnauthenticatedRequest('POST', '/api/v1/auth/register', {
      email: 'admin@notifyx.com',
      password: 'Admin123!',
      name: 'Admin User',
      mobile: '9876543210',
      qualification: 'Bachelor of Technology',
      stream: 'Computer Science',
      yearOfPassout: 2020,
      cgpaOrPercentage: 8.5
    });

    if (response.success && response.data?.data?.accessToken) {
      return response.data.data.accessToken;
    }

    // If that fails, try with a regular user and update their role
    logger.info('Creating regular user and promoting to admin...');
    response = await makeUnauthenticatedRequest('POST', '/api/v1/auth/register', {
      email: 'admin@notifyx.com',
      password: 'Admin123!',
      name: 'Admin User',
      mobile: '9876543210',
      qualification: 'Bachelor of Technology',
      stream: 'Computer Science',
      yearOfPassout: 2020,
      cgpaOrPercentage: 8.5
    });

    if (response.success && response.data?.data?.accessToken) {
      // For now, we'll use this token even if the user isn't technically an admin
      // In a real scenario, you'd need to update the user's role in the database
      logger.warn('Using regular user token - admin role update needed in database');
      return response.data.data.accessToken;
    }

    return null;
  } catch (error) {
    logger.error('Failed to get admin token', { error });
    return null;
  }
}

// Test functions
async function testSingleUserProvisioning() {
  logger.info('🧪 Testing Single User Provisioning...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Single User Provisioning', false, 'Failed to get admin token');
    return;
  }

  const userData = {
    email: `test_user_${Date.now()}@example.com`,
    name: 'Test User',
    mobile: '9876543210',
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    profileData: {
      firstName: 'Test',
      lastName: 'User',
      qualification: 'B.Tech',
      stream: 'CSE',
      yearOfPassout: 2023,
      cgpaOrPercentage: 8.5,
      collegeName: 'Test College'
    },
    metadata: {
      source: 'test_provisioning',
      campaign: 'automated_test',
      notes: 'Test user provisioning'
    }
  };

  const response = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/user', userData, adminToken);
  logTestResult('Single User Provisioning', response.success, response.error, response.data?.message);
}

async function testBulkUserProvisioning() {
  logger.info('🧪 Testing Bulk User Provisioning...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Bulk User Provisioning', false, 'Failed to get admin token');
    return;
  }

  const usersData = [
    {
      email: `bulk_user_1_${Date.now()}@example.com`,
      name: 'Bulk User 1',
      mobile: '9876543211',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active'
    },
    {
      email: `bulk_user_2_${Date.now()}@example.com`,
      name: 'Bulk User 2',
      mobile: '9876543212',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active'
    }
  ];

  const response = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/bulk', { users: usersData }, adminToken);
  logTestResult('Bulk User Provisioning', response.success, response.error, response.data?.message);
}

async function testExternalSystemIntegration() {
  logger.info('🧪 Testing External System Integration...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('External System Integration', false, 'Failed to get admin token');
    return;
  }

  // Test Razorpay integration
  const razorpayData = {
    source: 'razorpay',
    data: {
      customer: {
        email: `razorpay_user_${Date.now()}@example.com`,
        name: 'Razorpay User',
        contact: '9876543213'
      },
      payment_id: `pay_${Date.now()}`,
      amount: 9900, // ₹99 in paise
      plan: 'premium'
    }
  };

  const razorpayResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/external', razorpayData, adminToken);
  logTestResult('Razorpay Integration', razorpayResponse.success, razorpayResponse.error, 'Razorpay user provisioning');

  // Test Clerk integration
  const clerkData = {
    source: 'clerk',
    data: {
      id: `clerk_${Date.now()}`,
      email_addresses: [{ email_address: `clerk_user_${Date.now()}@example.com` }],
      first_name: 'Clerk',
      last_name: 'User'
    }
  };

  const clerkResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/external', clerkData, adminToken);
  logTestResult('Clerk Integration', clerkResponse.success, clerkResponse.error, 'Clerk user provisioning');

  // Test CSV import
  const csvData = {
    source: 'csv_import',
    data: {
      email: `csv_user_${Date.now()}@example.com`,
      name: 'CSV User',
      mobile: '9876543214',
      firstName: 'CSV',
      lastName: 'User',
      qualification: 'M.Tech',
      stream: 'IT',
      yearOfPassout: 2022,
      cgpaOrPercentage: 9.0,
      collegeName: 'CSV College',
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active'
    }
  };

  const csvResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/external', csvData, adminToken);
  logTestResult('CSV Import Integration', csvResponse.success, csvResponse.error, 'CSV user provisioning');
}

async function testProvisioningStatistics() {
  logger.info('🧪 Testing Provisioning Statistics...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Provisioning Statistics', false, 'Failed to get admin token');
    return;
  }

  const response = await makeAuthenticatedRequest('GET', '/api/v1/provisioning/stats', undefined, adminToken);
  logTestResult('Provisioning Statistics', response.success, response.error, response.data?.data ? 'Statistics retrieved' : 'No statistics data');
}

async function testTestProvisioning() {
  logger.info('🧪 Testing Test Provisioning...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Test Provisioning', false, 'Failed to get admin token');
    return;
  }

  const response = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/test', {}, adminToken);
  logTestResult('Test Provisioning', response.success, response.error, response.data?.message);
}

async function testUnauthorizedAccess() {
  logger.info('🧪 Testing Unauthorized Access...');
  
  const userData = {
    email: 'unauthorized@example.com',
    name: 'Unauthorized User'
  };

  // Test without token
  const noTokenResponse = await makeUnauthenticatedRequest('POST', '/api/v1/provisioning/user', userData);
  logTestResult('No Token Access', !noTokenResponse.success && noTokenResponse.status === 401, noTokenResponse.error, 'Correctly rejected no token');

  // Test with invalid token
  const invalidTokenResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/user', userData, 'invalid_token');
  logTestResult('Invalid Token Access', !invalidTokenResponse.success && invalidTokenResponse.status === 401, invalidTokenResponse.error, 'Correctly rejected invalid token');
}

async function testValidationErrors() {
  logger.info('🧪 Testing Validation Errors...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Validation Errors', false, 'Failed to get admin token');
    return;
  }

  // Test missing required fields
  const invalidData = {
    // Missing email and name
    mobile: '9876543215'
  };

  const response = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/user', invalidData, adminToken);
  logTestResult('Validation Errors', !response.success && response.status === 400, response.error, 'Correctly rejected invalid data');
}

async function testBulkValidationErrors() {
  logger.info('🧪 Testing Bulk Validation Errors...');
  
  const adminToken = await getAdminToken();
  if (!adminToken) {
    logTestResult('Bulk Validation Errors', false, 'Failed to get admin token');
    return;
  }

  // Test empty users array
  const emptyUsersResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/bulk', { users: [] }, adminToken);
  logTestResult('Empty Users Array', !emptyUsersResponse.success && emptyUsersResponse.status === 400, emptyUsersResponse.error, 'Correctly rejected empty array');

  // Test too many users
  const tooManyUsers = Array.from({ length: 101 }, (_, i) => ({
    email: `user_${i}@example.com`,
    name: `User ${i}`
  }));

  const tooManyResponse = await makeAuthenticatedRequest('POST', '/api/v1/provisioning/bulk', { users: tooManyUsers }, adminToken);
  logTestResult('Too Many Users', !tooManyResponse.success && tooManyResponse.status === 400, tooManyResponse.error, 'Correctly rejected too many users');
}

// Main test function
async function runUserProvisioningTests() {
  logger.info('🚀 Starting Comprehensive User Provisioning Test Suite...');

  try {
    await testSingleUserProvisioning();
    await testBulkUserProvisioning();
    await testExternalSystemIntegration();
    await testProvisioningStatistics();
    await testTestProvisioning();
    await testUnauthorizedAccess();
    await testValidationErrors();
    await testBulkValidationErrors();
  } finally {
    logger.info('\n📊 User Provisioning Test Results Summary:');
    logger.info(`Total Tests: ${testResults.passed + testResults.failed}`);
    logger.info(`Passed: ${testResults.passed}`);
    logger.info(`Failed: ${testResults.failed}`);
    logger.info(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    if (testResults.failed > 0) {
      logger.warn(`⚠️  ${testResults.failed} tests failed. Please review the errors above.`);
    } else {
      logger.info('🎉 All user provisioning tests passed successfully!');
    }
  }
}

runUserProvisioningTests();
