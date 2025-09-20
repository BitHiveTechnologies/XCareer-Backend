#!/usr/bin/env npx ts-node

import axios from 'axios';

/**
 * Comprehensive API Testing Script with Clerk Authentication
 * 
 * This script tests all endpoints with a fresh Clerk token
 * Run this script and it will guide you through getting a token and testing everything
 */

const BASE_URL = 'http://localhost:3000/api/v1';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  statusCode?: number;
  response?: any;
  error?: string;
}

const testResults: TestResult[] = [];

async function testEndpoint(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  token: string,
  data?: any
): Promise<TestResult> {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let response;
    switch (method) {
      case 'GET':
        response = await axios.get(url, { headers });
        break;
      case 'POST':
        response = await axios.post(url, data, { headers });
        break;
      case 'PUT':
        response = await axios.put(url, data, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers });
        break;
    }

    return {
      endpoint,
      method,
      status: 'SUCCESS',
      statusCode: response.status,
      response: response.data
    };
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

async function testAllEndpoints(token: string) {
  console.log('🧪 Starting Comprehensive API Testing with Clerk Authentication...\n');

  // Test Clerk Authentication
  console.log('1. Testing Clerk Authentication...');
  testResults.push(await testEndpoint('GET', '/clerk-auth/me', token));

  // Test User Management
  console.log('2. Testing User Management...');
  testResults.push(await testEndpoint('GET', '/users/profile', token));
  testResults.push(await testEndpoint('PUT', '/users/profile', token, {
    firstName: 'Test',
    lastName: 'User'
  }));

  // Test Job Management
  console.log('3. Testing Job Management...');
  testResults.push(await testEndpoint('GET', '/jobs', token));
  testResults.push(await testEndpoint('GET', '/jobs/search?q=engineer', token));
  testResults.push(await testEndpoint('POST', '/jobs', token, {
    title: 'Test Job',
    company: 'Test Company',
    location: 'Remote',
    type: 'full-time',
    description: 'Test job description',
    requirements: ['Node.js', 'TypeScript'],
    salary: {
      min: 50000,
      max: 80000,
      currency: 'USD'
    }
  }));

  // Test Subscription Management
  console.log('4. Testing Subscription Management...');
  testResults.push(await testEndpoint('GET', '/subscriptions', token));
  testResults.push(await testEndpoint('POST', '/subscriptions', token, {
    plan: 'premium',
    billingCycle: 'monthly'
  }));

  // Test Payment Processing
  console.log('5. Testing Payment Processing...');
  testResults.push(await testEndpoint('GET', '/payments/history', token));
  testResults.push(await testEndpoint('POST', '/payments/create-intent', token, {
    amount: 2999,
    currency: 'usd',
    plan: 'premium'
  }));

  // Test Notifications
  console.log('6. Testing Notifications...');
  testResults.push(await testEndpoint('GET', '/notifications', token));
  testResults.push(await testEndpoint('PUT', '/notifications/mark-read', token, {
    notificationIds: ['test-id']
  }));

  // Test Admin Endpoints (if user is admin)
  console.log('7. Testing Admin Endpoints...');
  testResults.push(await testEndpoint('GET', '/admin/dashboard', token));
  testResults.push(await testEndpoint('GET', '/admin/users', token));
  testResults.push(await testEndpoint('GET', '/admin/jobs', token));
  testResults.push(await testEndpoint('GET', '/admin/analytics', token));

  // Generate Report
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log('='.repeat(80));

  const successCount = testResults.filter(r => r.status === 'SUCCESS').length;
  const failedCount = testResults.filter(r => r.status === 'FAILED').length;

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📈 Success Rate: ${((successCount / testResults.length) * 100).toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS\n');
  console.log('='.repeat(80));

  testResults.forEach((result, index) => {
    const statusIcon = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${index + 1}. ${statusIcon} ${result.method} ${result.endpoint}`);
    console.log(`   Status: ${result.statusCode || 'N/A'} - ${result.status}`);
    
    if (result.status === 'SUCCESS') {
      console.log(`   Response: ${JSON.stringify(result.response).substring(0, 100)}...`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS\n');
  console.log('='.repeat(80));

  const failedEndpoints = testResults.filter(r => r.status === 'FAILED');
  if (failedEndpoints.length > 0) {
    console.log('Failed endpoints that need attention:');
    failedEndpoints.forEach(endpoint => {
      console.log(`- ${endpoint.method} ${endpoint.endpoint}: ${endpoint.error}`);
    });
  } else {
    console.log('🎉 All endpoints are working correctly!');
  }
}

async function main() {
  console.log('🚀 NotifyX Backend API Testing Script');
  console.log('=====================================\n');

  // Get token from user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const token = await new Promise<string>((resolve) => {
    rl.question('Please paste your Clerk token here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.log('❌ No token provided. Exiting...');
    process.exit(1);
  }

  // Test health endpoint first
  try {
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend server is running');
  } catch (error) {
    console.log('❌ Backend server is not running. Please start it with: npm run dev');
    process.exit(1);
  }

  await testAllEndpoints(token);
}

if (require.main === module) {
  main().catch(console.error);
}

export { testAllEndpoints };

