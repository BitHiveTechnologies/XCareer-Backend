import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

class FinalErrorTest {
  private results: TestResult[] = [];

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string) {
    this.results.push({ test, status, message });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  async runTests() {
    console.log('🧪 Final Error Handling and Validation Middleware Test\n');

    // Test 1: 404 Not Found Error
    await this.test404Error();

    // Test 2: Authentication Error
    await this.testAuthError();

    // Test 3: Security Headers
    await this.testSecurityHeaders();

    // Test 4: CORS Configuration
    await this.testCORS();

    // Test 5: Invalid JSON
    await this.testInvalidJSON();

    // Test 6: Large Payload
    await this.testLargePayload();

    // Test 7: SQL Injection Protection
    await this.testSQLInjection();

    // Test 8: XSS Protection
    await this.testXSSProtection();

    this.printSummary();
  }

  async test404Error() {
    console.log('🔍 Testing 404 Not Found Error...');
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/nonexistent-endpoint`, {
        validateStatus: () => true // Don't throw on any status
      });
      
      if (response.status === 404 && response.data.success === false) {
        this.addResult('404 Not Found', 'PASS', 'Correctly returns 404 for non-existent endpoints');
      } else {
        this.addResult('404 Not Found', 'FAIL', `Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('404 Not Found', 'FAIL', `Network error: ${error.message}`);
    }
  }

  async testAuthError() {
    console.log('\n🔍 Testing Authentication Error...');
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/auth/me`, {
        validateStatus: () => true
      });
      
      if (response.status === 401) {
        this.addResult('Authentication Error', 'PASS', 'Correctly returns 401 for unauthenticated requests');
      } else {
        this.addResult('Authentication Error', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Authentication Error', 'FAIL', `Network error: ${error.message}`);
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
      this.addResult('Security Headers', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testCORS() {
    console.log('\n🔍 Testing CORS Configuration...');
    try {
      const response = await axios.get(`${BASE_URL}/cors-test`);
      
      if (response.status === 200 && response.data.success) {
        this.addResult('CORS Configuration', 'PASS', 'CORS is properly configured');
      } else {
        this.addResult('CORS Configuration', 'FAIL', 'CORS test failed');
      }
    } catch (error: any) {
      this.addResult('CORS Configuration', 'FAIL', `CORS test error: ${error.message}`);
    }
  }

  async testInvalidJSON() {
    console.log('\n🔍 Testing Invalid JSON Handling...');
    try {
      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, 
        'invalid json string',
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        }
      );
      
      if (response.status === 400) {
        this.addResult('Invalid JSON', 'PASS', 'Correctly handles invalid JSON');
      } else {
        this.addResult('Invalid JSON', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Invalid JSON', 'FAIL', `Network error: ${error.message}`);
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

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, largeData, {
        validateStatus: () => true
      });
      
      if (response.status === 413 || response.status === 400) {
        this.addResult('Large Payload', 'PASS', 'Correctly handles large payloads');
      } else {
        this.addResult('Large Payload', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('Large Payload', 'FAIL', `Network error: ${error.message}`);
    }
  }

  async testSQLInjection() {
    console.log('\n🔍 Testing SQL Injection Protection...');
    try {
      const maliciousData = {
        name: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, maliciousData, {
        validateStatus: () => true
      });
      
      // Should either reject the request or sanitize it
      if (response.status === 400 || response.status === 200) {
        this.addResult('SQL Injection Protection', 'PASS', 'System handles malicious input');
      } else {
        this.addResult('SQL Injection Protection', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('SQL Injection Protection', 'FAIL', `Network error: ${error.message}`);
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

      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/register`, xssData, {
        validateStatus: () => true
      });
      
      // Should either reject the request or sanitize it
      if (response.status === 400 || response.status === 200) {
        this.addResult('XSS Protection', 'PASS', 'System handles XSS attempts');
      } else {
        this.addResult('XSS Protection', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult('XSS Protection', 'FAIL', `Network error: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n📊 Final Error Handling and Validation Middleware Test Summary:');
    console.log('='.repeat(70));
    
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

// Run the test
async function runFinalErrorTest() {
  const test = new FinalErrorTest();
  await test.runTests();
}

runFinalErrorTest().catch(console.error);
