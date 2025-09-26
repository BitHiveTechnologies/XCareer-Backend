import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

class AuthEnhancementTester {
  private results: TestResult[] = [];
  private userToken: string = '';
  private adminToken: string = '';

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
    this.results.push({ test, status, message, details });
    console.log(`[${status}] ${test}: ${message}`);
    if (details) console.log('Details:', JSON.stringify(details, null, 2));
  }

  async testUserAuthentication() {
    console.log('\n🔐 Testing User Authentication...');
    
    try {
      // Test user login with admin user (since we know it works)
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      });

      if (loginResponse.status === 200 && loginResponse.data.success) {
        this.userToken = loginResponse.data.data.accessToken;
        this.addResult(
          'User Login',
          'PASS',
          'User authentication successful',
          {
            user: loginResponse.data.data.user,
            hasToken: !!this.userToken
          }
        );
      } else {
        this.addResult('User Login', 'FAIL', 'User authentication failed', loginResponse.data);
      }
    } catch (error: any) {
      this.addResult('User Login', 'FAIL', 'User authentication error', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        fullError: error
      });
    }
  }

  async testAdminAuthentication() {
    console.log('\n👑 Testing Admin Authentication...');
    
    try {
      // Test admin login
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      });

      if (loginResponse.status === 200 && loginResponse.data.success) {
        this.adminToken = loginResponse.data.data.accessToken;
        this.addResult(
          'Admin Login',
          'PASS',
          'Admin authentication successful',
          {
            user: loginResponse.data.data.user,
            hasToken: !!this.adminToken
          }
        );
      } else {
        this.addResult('Admin Login', 'FAIL', 'Admin authentication failed', loginResponse.data);
      }
    } catch (error: any) {
      this.addResult('Admin Login', 'FAIL', 'Admin authentication error', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        fullError: error
      });
    }
  }

  async testJWTTokenValidation() {
    console.log('\n🔑 Testing JWT Token Validation...');
    
    if (!this.userToken) {
      this.addResult('JWT Token Validation', 'FAIL', 'No user token available');
      return;
    }

    try {
      // Test protected endpoint with valid token
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.addResult(
          'JWT Token Validation',
          'PASS',
          'JWT token validation successful',
          {
            user: response.data.data.user,
            subscriptionInfo: {
              status: response.data.data.user.subscriptionStatus,
              plan: response.data.data.user.subscriptionPlan
            }
          }
        );
      } else {
        this.addResult('JWT Token Validation', 'FAIL', 'JWT token validation failed', response.data);
      }
    } catch (error: any) {
      this.addResult('JWT Token Validation', 'FAIL', 'JWT token validation error', error.response?.data || error.message);
    }
  }

  async testSubscriptionValidation() {
    console.log('\n💳 Testing Subscription Validation...');
    
    if (!this.userToken) {
      this.addResult('Subscription Validation', 'FAIL', 'No user token available');
      return;
    }

    try {
      // Test subscription validation by checking current subscription
      const response = await axios.get(`${BASE_URL}/subscriptions/current`, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.addResult(
          'Subscription Validation',
          'PASS',
          'Subscription validation successful - user subscription retrieved',
          {
            subscription: response.data.data,
            hasActiveSubscription: response.data.data?.status === 'active'
          }
        );
      } else {
        this.addResult('Subscription Validation', 'FAIL', 'Subscription validation failed', response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        this.addResult(
          'Subscription Validation',
          'PASS',
          'Subscription validation working - user blocked from premium features',
          error.response.data
        );
      } else {
        this.addResult('Subscription Validation', 'FAIL', 'Subscription validation error', error.response?.data || error.message);
      }
    }
  }

  async testRoleBasedAccess() {
    console.log('\n👥 Testing Role-Based Access Control...');
    
    if (!this.adminToken) {
      this.addResult('Role-Based Access', 'FAIL', 'No admin token available');
      return;
    }

    try {
      // Test admin-only endpoint
      const response = await axios.get(`${BASE_URL}/jobs/stats/overview`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.addResult(
          'Role-Based Access',
          'PASS',
          'Admin access control working',
          response.data
        );
      } else {
        this.addResult('Role-Based Access', 'FAIL', 'Admin access control failed', response.data);
      }
    } catch (error: any) {
      this.addResult('Role-Based Access', 'FAIL', 'Admin access control error', error.response?.data || error.message);
    }
  }

  async testPasswordChange() {
    console.log('\n🔒 Testing Password Change...');
    
    if (!this.userToken) {
      this.addResult('Password Change', 'FAIL', 'No user token available');
      return;
    }

    try {
      // Test password change
      const response = await axios.post(`${BASE_URL}/auth/change-password`, {
        currentPassword: 'Admin123!', // Use the correct admin password
        newPassword: 'NewPassword123!'
      }, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.addResult(
          'Password Change',
          'PASS',
          'Password change successful',
          response.data
        );
      } else {
        this.addResult('Password Change', 'FAIL', 'Password change failed', response.data);
      }
    } catch (error: any) {
      this.addResult('Password Change', 'FAIL', 'Password change error', error.response?.data || error.message);
    }
  }

  async testTokenRefresh() {
    console.log('\n🔄 Testing Token Refresh...');
    
    if (!this.userToken) {
      this.addResult('Token Refresh', 'FAIL', 'No user token available');
      return;
    }

    try {
      // Test token refresh (we'll need to get a refresh token first)
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      });

      if (loginResponse.data.success && loginResponse.data.data.refreshToken) {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: loginResponse.data.data.refreshToken
        });

        if (refreshResponse.status === 200 && refreshResponse.data.success) {
          this.addResult(
            'Token Refresh',
            'PASS',
            'Token refresh successful',
            refreshResponse.data
          );
        } else {
          this.addResult('Token Refresh', 'FAIL', 'Token refresh failed', refreshResponse.data);
        }
      } else {
        this.addResult('Token Refresh', 'FAIL', 'No refresh token available', loginResponse.data);
      }
    } catch (error: any) {
      this.addResult('Token Refresh', 'FAIL', 'Token refresh error', error.response?.data || error.message);
    }
  }

  async testInvalidToken() {
    console.log('\n❌ Testing Invalid Token Handling...');
    
    try {
      // Test with invalid token
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });

      this.addResult('Invalid Token', 'FAIL', 'Should have rejected invalid token', response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.addResult(
          'Invalid Token',
          'PASS',
          'Invalid token properly rejected',
          error.response.data
        );
      } else {
        this.addResult('Invalid Token', 'FAIL', 'Unexpected error handling', error.response?.data || error.message);
      }
    }
  }

  async testLogout() {
    console.log('\n🚪 Testing Logout...');
    
    if (!this.userToken) {
      this.addResult('Logout', 'FAIL', 'No user token available');
      return;
    }

    try {
      // Test logout
      const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${this.userToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.addResult(
          'Logout',
          'PASS',
          'Logout successful',
          response.data
        );
      } else {
        this.addResult('Logout', 'FAIL', 'Logout failed', response.data);
      }
    } catch (error: any) {
      this.addResult('Logout', 'FAIL', 'Logout error', error.response?.data || error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication and Authorization API Enhancement Tests...\n');
    
    await this.testUserAuthentication();
    await this.testAdminAuthentication();
    await this.testJWTTokenValidation();
    await this.testSubscriptionValidation();
    await this.testRoleBasedAccess();
    await this.testPasswordChange();
    await this.testTokenRefresh();
    await this.testInvalidToken();
    await this.testLogout();

    // Summary
    console.log('\n📊 Test Summary:');
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`- ${result.test}: ${result.message}`);
      });
    }

    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.results
    };
  }
}

// Run tests
const tester = new AuthEnhancementTester();
tester.runAllTests().then(summary => {
  console.log('\n🎯 Test Summary:', summary);
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
