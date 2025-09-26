import axios from 'axios';

const BASE_URL = `http://localhost:3001/api/v1`;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class SecureLoginTester {
  private results: TestResult[] = [];

  private async makeRequest(method: string, endpoint: string, data?: any, headers?: any) {
    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000
      });
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  private addResult(name: string, passed: boolean, error?: string, details?: any) {
    this.results.push({ name, passed, error, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${name}`);
    if (error) console.log(`   Error: ${error}`);
    if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }

  async testBasicLogin() {
    console.log('\n🔐 Testing Basic Login Functionality...');
    
    // Test 1: Valid login with active subscription
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (loginResponse.success && loginResponse.data.success) {
      this.addResult('Valid Login with Active Subscription', true, undefined, {
        user: loginResponse.data.data.user,
        hasToken: !!loginResponse.data.data.accessToken
      });
      return loginResponse.data.data.accessToken;
    } else {
      this.addResult('Valid Login with Active Subscription', false, loginResponse.error);
      return null;
    }
  }

  async testSubscriptionValidation() {
    console.log('\n📋 Testing Subscription Validation...');
    
    // Test 1: Login with expired subscription
    const expiredUserResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'sarah.johnson@example.com',
      password: 'SarahJohnson123!'
    });

    if (expiredUserResponse.success && expiredUserResponse.data.success) {
      this.addResult('Login with Expired Subscription', false, 'Should have been blocked');
    } else if (expiredUserResponse.error?.error?.message === 'Account subscription has expired') {
      this.addResult('Login with Expired Subscription', true, undefined, {
        blocked: true,
        message: expiredUserResponse.error.error.message
      });
    } else {
      this.addResult('Login with Expired Subscription', false, expiredUserResponse.error);
    }

    // Test 2: Login with inactive subscription (should be allowed and activated)
    const inactiveUserResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'mike.wilson@example.com',
      password: 'MikeWilson123!'
    });

    if (inactiveUserResponse.success && inactiveUserResponse.data.success) {
      this.addResult('Login with Inactive Subscription', true, undefined, {
        user: inactiveUserResponse.data.data.user,
        status: inactiveUserResponse.data.data.user.subscriptionStatus
      });
    } else {
      this.addResult('Login with Inactive Subscription', false, inactiveUserResponse.error);
    }
  }

  async testTokenRefresh() {
    console.log('\n🔄 Testing Token Refresh...');
    
    // First login to get tokens
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (!loginResponse.success) {
      this.addResult('Token Refresh - Initial Login', false, loginResponse.error);
      return;
    }

    const refreshToken = loginResponse.data.data.refreshToken;
    
    // Test refresh token
    const refreshResponse = await this.makeRequest('POST', '/auth/refresh', {
      refreshToken
    });

    if (refreshResponse.success && refreshResponse.data.success) {
      this.addResult('Token Refresh', true, undefined, {
        newToken: !!refreshResponse.data.data.accessToken
      });
    } else {
      this.addResult('Token Refresh', false, refreshResponse.error);
    }
  }

  async testCurrentUserEndpoint() {
    console.log('\n👤 Testing Current User Endpoint...');
    
    // Get auth token
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (!loginResponse.success) {
      this.addResult('Current User - Initial Login', false, loginResponse.error);
      return;
    }

    const accessToken = loginResponse.data.data.accessToken;
    
    // Test current user endpoint
    const currentUserResponse = await this.makeRequest('GET', '/jwt-auth/me', undefined, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (currentUserResponse.success && currentUserResponse.data.success) {
      this.addResult('Current User Endpoint', true, undefined, {
        user: currentUserResponse.data.data.user,
        profile: currentUserResponse.data.data.profile
      });
    } else {
      this.addResult('Current User Endpoint', false, currentUserResponse.error);
    }
  }

  async testPasswordChange() {
    console.log('\n🔑 Testing Password Change...');
    
    // Get auth token
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (!loginResponse.success) {
      this.addResult('Password Change - Initial Login', false, loginResponse.error);
      return;
    }

    const accessToken = loginResponse.data.data.accessToken;
    
    // Test password change
    const passwordChangeResponse = await this.makeRequest('POST', '/auth/change-password', {
      currentPassword: 'JohnDoe123!',
      newPassword: 'NewPassword123!'
    }, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (passwordChangeResponse.success && passwordChangeResponse.data.success) {
      this.addResult('Password Change', true, undefined, {
        message: passwordChangeResponse.data.data.message
      });
    } else {
      this.addResult('Password Change', false, passwordChangeResponse.error);
    }
  }

  async testLogout() {
    console.log('\n🚪 Testing Logout...');
    
    // Get auth token
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (!loginResponse.success) {
      this.addResult('Logout - Initial Login', false, loginResponse.error);
      return;
    }

    const accessToken = loginResponse.data.data.accessToken;
    
    // Test logout
    const logoutResponse = await this.makeRequest('POST', '/auth/logout', undefined, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (logoutResponse.success && logoutResponse.data.success) {
      this.addResult('Logout', true, undefined, {
        message: logoutResponse.data.data.message
      });
    } else {
      this.addResult('Logout', false, logoutResponse.error);
    }
  }

  async testInvalidCredentials() {
    console.log('\n❌ Testing Invalid Credentials...');
    
    // Test 1: Invalid email
    const invalidEmailResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'nonexistent@example.com',
      password: 'SomePassword123!'
    });

    if (!invalidEmailResponse.success && invalidEmailResponse.error?.error?.message === 'Invalid email or password') {
      this.addResult('Invalid Email', true, undefined, {
        blocked: true,
        message: invalidEmailResponse.error.error.message
      });
    } else {
      this.addResult('Invalid Email', false, invalidEmailResponse.error);
    }

    // Test 2: Invalid password
    const invalidPasswordResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'WrongPassword123!'
    });

    if (!invalidPasswordResponse.success && invalidPasswordResponse.error?.error?.message === 'Invalid email or password') {
      this.addResult('Invalid Password', true, undefined, {
        blocked: true,
        message: invalidPasswordResponse.error.error.message
      });
    } else {
      this.addResult('Invalid Password', false, invalidPasswordResponse.error);
    }
  }

  async testSubscriptionStatusValidation() {
    console.log('\n📊 Testing Subscription Status Validation...');
    
    // Test 1: Check subscription status in user profile
    const loginResponse = await this.makeRequest('POST', '/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (loginResponse.success && loginResponse.data.success) {
      const user = loginResponse.data.data.user;
      this.addResult('Subscription Status in Profile', true, undefined, {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan
      });
    } else {
      this.addResult('Subscription Status in Profile', false, loginResponse.error);
    }
  }

  async runAllTests() {
    console.log('🚀 SECURE LOGIN ENDPOINT TESTING');
    console.log('=====================================');
    
    await this.testBasicLogin();
    await this.testSubscriptionValidation();
    await this.testTokenRefresh();
    await this.testCurrentUserEndpoint();
    await this.testPasswordChange();
    await this.testLogout();
    await this.testInvalidCredentials();
    await this.testSubscriptionStatusValidation();
    
    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (passed === total) {
      console.log('\n🎉 ALL TESTS PASSED! Secure login endpoint is working perfectly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
  }
}

// Run the tests
async function main() {
  const tester = new SecureLoginTester();
  await tester.runAllTests();
}

main().catch(console.error);
