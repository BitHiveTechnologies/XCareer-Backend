import axios from 'axios';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class AdminDashboardEnhancementTester {
  private baseUrl: string;
  private adminToken: string = '';
  private testUserId: string = '';

  constructor() {
    this.baseUrl = 'http://localhost:3001';
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Admin Dashboard API Enhancement Tests...\n');

    const tests = [
      () => this.testAuthentication(),
      () => this.testSubscriptionManagement(),
      () => this.testPaymentTracking(),
      () => this.testUserManagement(),
      () => this.testContentManagement(),
      () => this.testUpdateUserSubscription(),
      () => this.testAdminDashboardIntegration()
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }
        console.log('');
      } catch (error: any) {
        console.log(`❌ Test failed with exception: ${error.message}`);
        results.push({
          name: 'Test Exception',
          passed: false,
          error: error.message
        });
        console.log('');
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All Admin Dashboard Enhancement tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Admin Authentication...');

      // Test admin login
      const adminResponse = await axios.post(`${this.baseUrl}/api/v1/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      }, { timeout: 5000 });

      if (adminResponse.data.success) {
        this.adminToken = adminResponse.data.data.accessToken;
        console.log('✅ Admin authentication successful');
      } else {
        return {
          name: 'Admin Authentication',
          passed: false,
          error: 'Admin authentication failed'
        };
      }

      return {
        name: 'Admin Authentication',
        passed: true,
        details: {
          adminToken: !!this.adminToken
        }
      };
    } catch (error: any) {
      console.log('❌ Admin authentication failed:', error.message);
      return {
        name: 'Admin Authentication',
        passed: false,
        error: error.message
      };
    }
  }

  private async testSubscriptionManagement(): Promise<TestResult> {
    try {
      console.log('\n📊 Testing Subscription Management...');

      const response = await axios.get(`${this.baseUrl}/api/v1/admin/subscriptions`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ Subscription management data retrieved');
        console.log(`   Total Subscriptions: ${data.overview.totalSubscriptions}`);
        console.log(`   Active Subscriptions: ${data.overview.activeSubscriptions}`);
        console.log(`   Recent Subscriptions: ${data.recentSubscriptions.length}`);
        console.log(`   Expiring Subscriptions: ${data.expiringSubscriptions.length}`);
      }

      return {
        name: 'Subscription Management',
        passed: response.data.success,
        details: response.data.success ? {
          totalSubscriptions: response.data.data.overview.totalSubscriptions,
          activeSubscriptions: response.data.data.overview.activeSubscriptions,
          recentSubscriptions: response.data.data.recentSubscriptions.length
        } : undefined
      };
    } catch (error: any) {
      console.log('❌ Subscription management test failed:', error.message);
      return {
        name: 'Subscription Management',
        passed: false,
        error: error.message
      };
    }
  }

  private async testPaymentTracking(): Promise<TestResult> {
    try {
      console.log('\n💰 Testing Payment Tracking...');

      // Test with different periods
      const periods = ['7d', '30d', '90d'];
      
      for (const period of periods) {
        const response = await axios.get(`${this.baseUrl}/api/v1/admin/payments?period=${period}`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: 10000
        });

        if (response.data.success) {
          const data = response.data.data;
          console.log(`✅ Payment tracking (${period}) data retrieved`);
          console.log(`   Total Revenue: ₹${data.overview.totalRevenue}`);
          console.log(`   Successful Payments: ${data.overview.successfulPayments}`);
          console.log(`   Failed Payments: ${data.overview.failedPayments}`);
          console.log(`   Top Customers: ${data.topCustomers.length}`);
        } else {
          return {
            name: 'Payment Tracking',
            passed: false,
            error: `Payment tracking failed for period ${period}`
          };
        }
      }

      return {
        name: 'Payment Tracking',
        passed: true,
        details: {
          periodsTested: periods.length,
          message: 'All payment tracking periods working'
        }
      };
    } catch (error: any) {
      console.log('❌ Payment tracking test failed:', error.message);
      return {
        name: 'Payment Tracking',
        passed: false,
        error: error.message
      };
    }
  }

  private async testUserManagement(): Promise<TestResult> {
    try {
      console.log('\n👥 Testing User Management...');

      // Test basic user management
      const response = await axios.get(`${this.baseUrl}/api/v1/admin/users?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ User management data retrieved');
        console.log(`   Total Users: ${data.pagination.totalUsers}`);
        console.log(`   Current Page: ${data.pagination.currentPage}`);
        console.log(`   Users Returned: ${data.users.length}`);
        console.log(`   Active Users: ${data.statistics.activeUsers}`);
      }

      // Test user search
      const searchResponse = await axios.get(`${this.baseUrl}/api/v1/admin/users?search=john&page=1&limit=5`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 10000
      });

      if (searchResponse.data.success) {
        console.log('✅ User search functionality working');
        this.testUserId = searchResponse.data.data.users[0]?._id || '';
      }

      return {
        name: 'User Management',
        passed: response.data.success && searchResponse.data.success,
        details: response.data.success ? {
          totalUsers: response.data.data.pagination.totalUsers,
          usersReturned: response.data.data.users.length,
          searchWorking: searchResponse.data.success
        } : undefined
      };
    } catch (error: any) {
      console.log('❌ User management test failed:', error.message);
      return {
        name: 'User Management',
        passed: false,
        error: error.message
      };
    }
  }

  private async testContentManagement(): Promise<TestResult> {
    try {
      console.log('\n📄 Testing Content Management...');

      const response = await axios.get(`${this.baseUrl}/api/v1/admin/content`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ Content management data retrieved');
        console.log(`   Total Templates: ${data.overview.totalTemplates}`);
        console.log(`   Basic Templates: ${data.overview.basicTemplates}`);
        console.log(`   Premium Templates: ${data.overview.premiumTemplates}`);
        console.log(`   Enterprise Templates: ${data.overview.enterpriseTemplates}`);
        console.log(`   Popular Templates: ${data.popularTemplates.length}`);
        console.log(`   Template Categories: ${data.templateCategories.length}`);
      }

      return {
        name: 'Content Management',
        passed: response.data.success,
        details: response.data.success ? {
          totalTemplates: response.data.data.overview.totalTemplates,
          popularTemplates: response.data.data.popularTemplates.length,
          templateCategories: response.data.data.templateCategories.length
        } : undefined
      };
    } catch (error: any) {
      console.log('❌ Content management test failed:', error.message);
      return {
        name: 'Content Management',
        passed: false,
        error: error.message
      };
    }
  }

  private async testUpdateUserSubscription(): Promise<TestResult> {
    try {
      console.log('\n🔄 Testing Update User Subscription...');

      // Use a known test user ID if testUserId is not available
      if (!this.testUserId) {
        // Try to get a user ID from the user management endpoint
        try {
          const userResponse = await axios.get(`${this.baseUrl}/api/v1/admin/users?page=1&limit=1`, {
            headers: { Authorization: `Bearer ${this.adminToken}` },
            timeout: 10000
          });
          
          if (userResponse.data.success && userResponse.data.data.users.length > 0) {
            this.testUserId = userResponse.data.data.users[0]._id;
            console.log(`   Using test user ID: ${this.testUserId}`);
          } else {
            return {
              name: 'Update User Subscription',
              passed: false,
              error: 'No test user ID available'
            };
          }
        } catch (error) {
          return {
            name: 'Update User Subscription',
            passed: false,
            error: 'No test user ID available'
          };
        }
      }

      const updateData = {
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        reason: 'Admin test update'
      };

      const response = await axios.put(
        `${this.baseUrl}/api/v1/admin/users/${this.testUserId}/subscription`,
        updateData,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: 10000
        }
      );

      if (response.data.success) {
        console.log('✅ User subscription updated successfully');
        console.log(`   New Status: ${response.data.data.user.subscriptionStatus}`);
        console.log(`   New Plan: ${response.data.data.user.subscriptionPlan}`);
      }

      return {
        name: 'Update User Subscription',
        passed: response.data.success,
        details: response.data.success ? {
          newStatus: response.data.data.user.subscriptionStatus,
          newPlan: response.data.data.user.subscriptionPlan
        } : undefined
      };
    } catch (error: any) {
      console.log('❌ Update user subscription test failed:', error.message);
      return {
        name: 'Update User Subscription',
        passed: false,
        error: error.message
      };
    }
  }

  private async testAdminDashboardIntegration(): Promise<TestResult> {
    try {
      console.log('\n🔗 Testing Admin Dashboard Integration...');

      // Test that all admin endpoints are accessible
      const endpoints = [
        '/api/v1/admin/dashboard',
        '/api/v1/admin/analytics/users',
        '/api/v1/admin/analytics/jobs',
        '/api/v1/admin/health',
        '/api/v1/admin/subscriptions',
        '/api/v1/admin/payments',
        '/api/v1/admin/users',
        '/api/v1/admin/content'
      ];

      const results = [];
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseUrl}${endpoint}`, {
            headers: { Authorization: `Bearer ${this.adminToken}` },
            timeout: 5000
          });
          results.push({ endpoint, status: response.status, success: response.data.success });
        } catch (error: any) {
          results.push({ endpoint, status: error.response?.status || 0, success: false, error: error.message });
        }
      }

      const successfulEndpoints = results.filter(r => r.success).length;
      console.log(`✅ ${successfulEndpoints}/${endpoints.length} admin endpoints accessible`);

      return {
        name: 'Admin Dashboard Integration',
        passed: successfulEndpoints === endpoints.length,
        details: {
          totalEndpoints: endpoints.length,
          successfulEndpoints,
          results
        }
      };
    } catch (error: any) {
      console.log('❌ Admin dashboard integration test failed:', error.message);
      return {
        name: 'Admin Dashboard Integration',
        passed: false,
        error: error.message
      };
    }
  }
}

// Run the tests
async function main() {
  const tester = new AdminDashboardEnhancementTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export default AdminDashboardEnhancementTester;
