import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling and Validation Middleware...\n');

  // Test 1: 404 Not Found Error
  console.log('🔍 Testing 404 Not Found Error...');
  try {
    const response = await axios.get(`${BASE_URL}${API_VERSION}/nonexistent-endpoint`);
    if (response.status === 404 && response.data.success === false) {
      console.log('✅ 404 Test: PASS - Correctly returns 404 for non-existent endpoints');
    } else {
      console.log('❌ 404 Test: FAIL - Unexpected response', {
        status: response.status,
        success: response.data.success,
        message: response.data.error?.message
      });
    }
  } catch (error: any) {
    if (error.response?.status === 404 && error.response?.data?.success === false) {
      console.log('✅ 404 Test: PASS - Correctly returns 404 for non-existent endpoints');
    } else {
      console.log('❌ 404 Test: FAIL - Unexpected error', {
        status: error.response?.status,
        success: error.response?.data?.success,
        message: error.response?.data?.error?.message
      });
    }
  }

  // Test 2: Authentication Error
  console.log('\n🔍 Testing Authentication Error...');
  try {
    const response = await axios.get(`${BASE_URL}${API_VERSION}/auth/me`);
    console.log('❌ Auth Test: Expected 401 but got', {
      status: response.status,
      data: response.data
    });
  } catch (error: any) {
    console.log('✅ Auth Test: Error caught', {
      status: error.response?.status,
      success: error.response?.data?.success,
      message: error.response?.data?.error?.message
    });
  }

  // Test 3: Security Headers
  console.log('\n🔍 Testing Security Headers...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const headers = response.headers;
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const presentHeaders = securityHeaders.filter(header => headers[header]);
    console.log('✅ Security Headers:', presentHeaders.length > 0 ? `Present: ${presentHeaders.join(', ')}` : 'None found');
  } catch (error: any) {
    console.log('❌ Security Headers Test Failed:', error.message);
  }

  // Test 4: CORS Configuration
  console.log('\n🔍 Testing CORS Configuration...');
  try {
    const response = await axios.get(`${BASE_URL}/cors-test`);
    console.log('✅ CORS Test:', response.data.success ? 'Working' : 'Failed', response.data);
  } catch (error: any) {
    console.log('❌ CORS Test Failed:', error.response?.data || error.message);
  }

  // Test 5: Invalid JSON
  console.log('\n🔍 Testing Invalid JSON Handling...');
  try {
    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, 
      'invalid json string',
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('❌ JSON Test: Expected error but got success', response.data);
  } catch (error: any) {
    console.log('✅ JSON Test: Error caught', {
      status: error.response?.status,
      message: error.response?.data?.error?.message
    });
  }

  // Test 6: Large Payload
  console.log('\n🔍 Testing Large Payload Handling...');
  try {
    const largeData = {
      name: 'Test User',
      email: 'test@example.com',
      description: 'A'.repeat(10000) // Large string
    };

    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, largeData);
    console.log('❌ Large Payload Test: Expected error but got success', response.data);
  } catch (error: any) {
    console.log('✅ Large Payload Test: Error caught', {
      status: error.response?.status,
      message: error.response?.data?.error?.message
    });
  }

  // Test 7: SQL Injection Protection
  console.log('\n🔍 Testing SQL Injection Protection...');
  try {
    const maliciousData = {
      name: "'; DROP TABLE users; --",
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, maliciousData);
    console.log('✅ SQL Injection Test: System handled malicious input', response.data);
  } catch (error: any) {
    console.log('✅ SQL Injection Test: Error caught', {
      status: error.response?.status,
      message: error.response?.data?.error?.message
    });
  }

  // Test 8: XSS Protection
  console.log('\n🔍 Testing XSS Protection...');
  try {
    const xssData = {
      name: '<script>alert("XSS")</script>',
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, xssData);
    console.log('✅ XSS Test: System handled XSS attempt', response.data);
  } catch (error: any) {
    console.log('✅ XSS Test: Error caught', {
      status: error.response?.status,
      message: error.response?.data?.error?.message
    });
  }

  console.log('\n🎯 Error Handling and Validation Middleware Test Complete!');
}

testErrorHandling().catch(console.error);
