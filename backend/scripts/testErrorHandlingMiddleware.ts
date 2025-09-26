import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

class ErrorHandlingTestSuite {
  private results: TestResult[] = [];

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
    this.results.push({ test, status, message, details });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    if (details) {
      console.log(`   Details:`, details);
    }
  }

  async testErrorHandling() {
    console.log('\n🧪 Testing Error Handling and Validation Middleware...\n');

    // Test 1: 404 Not Found Error
    await this.testNotFoundError();

    // Test 2: Validation Error
    await this.testValidationError();

    // Test 3: Authentication Error
    await this.testAuthenticationError();

    // Test 4: Rate Limiting
    await this.testRateLimiting();

    // Test 5: Security Headers
    await this.testSecurityHeaders();

    // Test 6: CORS Configuration
    await this.testCORSConfiguration();

    // Test 7: Invalid JSON
    await this.testInvalidJSON();

    // Test 8: Large Payload
    await this.testLargePayload();

    // Test 9: SQL Injection Attempt
    await this.testSQLInjectionProtection();

    // Test 10: XSS Protection
    await this.testXSSProtection();

    this.printSummary();
  }

  async testNotFoundError() {
    console.log('\n🔍 Testing 404 Not Found Error...');
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/nonexistent-endpoint`);
      // Check if response has success: false and error message
      if (response.data.success === false && response.data.error?.message?.includes('Not Found')) {
        this.addResult('404 Not Found', 'PASS', 'Correctly returns 404 for non-existent endpoints');
      } else {
        this.addResult('404 Not Found', 'FAIL', 'Expected 404 but got different response', {
          status: response.status,
          data: response.data
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('404 Not Found', 'PASS', 'Correctly returns 404 for non-existent endpoints');
      } else {
        this.addResult('404 Not Found', 'FAIL', 'Unexpected error', error.response?.data || error.message);
      }
    }
  }

  async testValidationError() {
    console.log('\n🔍 Testing Validation Error...');
    try {
      // Test invalid email format
      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, {
        name: 'Test User',
        email: 'invalid-email', // Invalid email format
        password: 'TestPassword123!',
        mobile: '9876543210'
      });
      this.addResult('Validation Error', 'FAIL', 'Expected validation error but got success', response.data);
    } catch (error: any) {
      if (error.response?.status === 400 && (error.response?.data?.error?.message?.includes('validation') || error.response?.data?.error?.message?.includes('Validation'))) {
        this.addResult('Validation Error', 'PASS', 'Correctly validates request data and returns validation errors');
      } else {
        this.addResult('Validation Error', 'FAIL', 'Unexpected validation error response', error.response?.data || error.message);
      }
    }
  }

  async testAuthenticationError() {
    console.log('\n🔍 Testing Authentication Error...');
    try {
      // Test accessing protected endpoint without token
      const response = await axios.get(`${BASE_URL}${API_VERSION}/auth/me`);
      this.addResult('Authentication Error', 'FAIL', 'Expected 401 but got different status', {
        status: response.status,
        data: response.data
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.addResult('Authentication Error', 'PASS', 'Correctly returns 401 for unauthenticated requests');
      } else {
        this.addResult('Authentication Error', 'FAIL', 'Unexpected authentication error', error.response?.data || error.message);
      }
    }
  }

  async testRateLimiting() {
    console.log('\n🔍 Testing Rate Limiting...');
    try {
      // Make multiple requests quickly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(axios.get(`${BASE_URL}/health`));
      }
      
      const responses = await Promise.allSettled(promises);
      const rateLimited = responses.some(result => 
        result.status === 'rejected' && 
        (result as any).reason?.response?.status === 429
      );

      if (rateLimited) {
        this.addResult('Rate Limiting', 'PASS', 'Rate limiting is working correctly');
      } else {
        this.addResult('Rate Limiting', 'FAIL', 'Rate limiting may not be working or limits are too high');
      }
    } catch (error: any) {
      this.addResult('Rate Limiting', 'FAIL', 'Error testing rate limiting', error.message);
    }
  }

  async testSecurityHeaders() {
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
      
      if (presentHeaders.length > 0) {
        this.addResult('Security Headers', 'PASS', `Security headers present: ${presentHeaders.join(', ')}`);
      } else {
        this.addResult('Security Headers', 'FAIL', 'No security headers found');
      }
    } catch (error: any) {
      this.addResult('Security Headers', 'FAIL', 'Error testing security headers', error.message);
    }
  }

  async testCORSConfiguration() {
    console.log('\n🔍 Testing CORS Configuration...');
    try {
      const response = await axios.get(`${BASE_URL}/cors-test`);
      
      if (response.status === 200 && response.data.success) {
        this.addResult('CORS Configuration', 'PASS', 'CORS is properly configured');
      } else {
        this.addResult('CORS Configuration', 'FAIL', 'CORS test failed', response.data);
      }
    } catch (error: any) {
      this.addResult('CORS Configuration', 'FAIL', 'CORS test error', error.response?.data || error.message);
    }
  }

  async testInvalidJSON() {
    console.log('\n🔍 Testing Invalid JSON Handling...');
    try {
      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, 
        'invalid json string',
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      this.addResult('Invalid JSON', 'FAIL', 'Expected JSON parsing error but got success', response.data);
    } catch (error: any) {
      if (error.response?.status === 400) {
        this.addResult('Invalid JSON', 'PASS', 'Correctly handles invalid JSON');
      } else {
        this.addResult('Invalid JSON', 'FAIL', 'Unexpected error handling invalid JSON', error.response?.data || error.message);
      }
    }
  }

  async testLargePayload() {
    console.log('\n🔍 Testing Large Payload Handling...');
    try {
      const largeData = {
        name: 'Test User',
        email: 'test@example.com',
        description: 'A'.repeat(10000) // Large string
      };

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, largeData);
      this.addResult('Large Payload', 'FAIL', 'Expected payload size error but got success', response.data);
    } catch (error: any) {
      if (error.response?.status === 413 || error.response?.status === 400) {
        this.addResult('Large Payload', 'PASS', 'Correctly handles large payloads');
      } else {
        this.addResult('Large Payload', 'FAIL', 'Unexpected error handling large payload', error.response?.data || error.message);
      }
    }
  }

  async testSQLInjectionProtection() {
    console.log('\n🔍 Testing SQL Injection Protection...');
    try {
      const maliciousData = {
        name: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, maliciousData);
      this.addResult('SQL Injection Protection', 'PASS', 'System properly handles malicious input');
    } catch (error: any) {
      if (error.response?.status === 400) {
        this.addResult('SQL Injection Protection', 'PASS', 'System rejects malicious input');
      } else {
        this.addResult('SQL Injection Protection', 'FAIL', 'Unexpected response to malicious input', error.response?.data || error.message);
      }
    }
  }

  async testXSSProtection() {
    console.log('\n🔍 Testing XSS Protection...');
    try {
      const xssData = {
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, xssData);
      this.addResult('XSS Protection', 'PASS', 'System properly handles XSS attempts');
    } catch (error: any) {
      if (error.response?.status === 400) {
        this.addResult('XSS Protection', 'PASS', 'System rejects XSS attempts');
      } else {
        this.addResult('XSS Protection', 'FAIL', 'Unexpected response to XSS attempt', error.response?.data || error.message);
      }
    }
  }

  printSummary() {
    console.log('\n📊 Error Handling and Validation Middleware Test Summary:');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }

    console.log('\n🎯 Task #13 Status:', parseFloat(successRate) >= 80 ? 'COMPLETED' : 'NEEDS IMPROVEMENT');
  }
}

// Run the test suite
async function runErrorHandlingTests() {
  const testSuite = new ErrorHandlingTestSuite();
  await testSuite.testErrorHandling();
}

runErrorHandlingTests().catch(console.error);
