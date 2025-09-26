import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class NotificationSystemTester {
  private authToken: string = '';
  private adminToken: string = '';
  private testUserId: string = '';
  private testNotificationId: string = '';

  async runTests(): Promise<void> {
    console.log('🚀 Starting Notification System API Tests');
    console.log('=====================================\n');

    const tests = [
      this.testAuthentication,
      this.testGetUserNotifications,
      this.testCreateNotification,
      this.testMarkNotificationAsRead,
      this.testMarkAllNotificationsAsRead,
      this.testGetNotificationStats,
      this.testDeleteNotification,
      this.testAdminCreateNotification,
      this.testBulkCreateNotifications,
      this.testNotificationFiltering
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test.call(this);
        results.push(result);
        
        if (result.passed) {
          console.log(`✅ ${result.name}`);
          if (result.details) {
            console.log(`   Details: ${JSON.stringify(result.details)}`);
          }
        } else {
          console.log(`❌ ${result.name}: ${result.error}`);
        }
      } catch (error: any) {
        console.log(`❌ ${test.name}: ${error.message}`);
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
      console.log('');
    }

    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${successRate}%`);

    if (passed === total) {
      console.log('\n🎉 All notification system tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');

      // Test user login
      const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'mike.wilson@example.com',
        password: 'MikeWilson123!'
      }, { timeout: 5000 });

      if (userResponse.data.success) {
        this.authToken = userResponse.data.data.accessToken;
        this.testUserId = userResponse.data.data.user.id;
        console.log('✅ User authentication successful');
      } else {
        return {
          name: 'Authentication',
          passed: false,
          error: 'User authentication failed'
        };
      }

      // Test admin login
      const adminResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      }, { timeout: 5000 });

      if (adminResponse.data.success) {
        this.adminToken = adminResponse.data.data.accessToken;
        console.log('✅ Admin authentication successful');
      } else {
        return {
          name: 'Authentication',
          passed: false,
          error: 'Admin authentication failed'
        };
      }

      return {
        name: 'Authentication',
        passed: true,
        details: {
          userToken: !!this.authToken,
          adminToken: !!this.adminToken,
          userId: this.testUserId
        }
      };
    } catch (error: any) {
      return {
        name: 'Authentication',
        passed: false,
        error: error.message
      };
    }
  }

  private async testGetUserNotifications(): Promise<TestResult> {
    try {
      console.log('📋 Testing Get User Notifications...');

      const response = await axios.get(`${BASE_URL}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.data.notifications.length} notifications`);
        console.log(`   Total: ${response.data.data.pagination.totalNotifications}`);
        console.log(`   Unread: ${response.data.data.statistics.unread}`);
        console.log(`   Read: ${response.data.data.statistics.read}`);
      }

      return {
        name: 'Get User Notifications',
        passed: response.data.success,
        details: response.data.success ? {
          total: response.data.data.pagination.totalNotifications,
          unread: response.data.data.statistics.unread,
          read: response.data.data.statistics.read
        } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Get User Notifications',
        passed: false,
        error: error.message
      };
    }
  }

  private async testCreateNotification(): Promise<TestResult> {
    try {
      console.log('📝 Testing Create Notification (Admin)...');

      const notificationData = {
        userId: this.testUserId,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification created by the API test.',
        priority: 'medium',
        category: 'info',
        actionUrl: 'https://example.com',
        actionText: 'View Details'
      };

      const response = await axios.post(`${BASE_URL}/api/v1/notifications`, notificationData, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        this.testNotificationId = response.data.data.notification._id;
        console.log(`✅ Notification created with ID: ${this.testNotificationId}`);
      }

      return {
        name: 'Create Notification',
        passed: response.data.success,
        details: response.data.success ? { notificationId: this.testNotificationId } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Create Notification',
        passed: false,
        error: error.message
      };
    }
  }

  private async testMarkNotificationAsRead(): Promise<TestResult> {
    try {
      console.log('✅ Testing Mark Notification as Read...');

      if (!this.testNotificationId) {
        return {
          name: 'Mark Notification as Read',
          passed: false,
          error: 'No test notification ID available'
        };
      }

      const response = await axios.put(
        `${BASE_URL}/api/v1/notifications/${this.testNotificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        }
      );

      if (response.data.success) {
        console.log('✅ Notification marked as read');
      }

      return {
        name: 'Mark Notification as Read',
        passed: response.data.success,
        details: response.data.success ? { notificationId: this.testNotificationId } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Mark Notification as Read',
        passed: false,
        error: error.message
      };
    }
  }

  private async testMarkAllNotificationsAsRead(): Promise<TestResult> {
    try {
      console.log('✅ Testing Mark All Notifications as Read...');

      const response = await axios.put(
        `${BASE_URL}/api/v1/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        }
      );

      if (response.data.success) {
        console.log(`✅ Marked ${response.data.data.modifiedCount} notifications as read`);
      }

      return {
        name: 'Mark All Notifications as Read',
        passed: response.data.success,
        details: response.data.success ? { modifiedCount: response.data.data.modifiedCount } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Mark All Notifications as Read',
        passed: false,
        error: error.message
      };
    }
  }

  private async testGetNotificationStats(): Promise<TestResult> {
    try {
      console.log('📊 Testing Get Notification Statistics...');

      const response = await axios.get(`${BASE_URL}/api/v1/notifications/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        console.log('✅ Notification statistics retrieved');
        console.log(`   Total: ${response.data.data.overview.total}`);
        console.log(`   Unread: ${response.data.data.overview.unread}`);
        console.log(`   Read: ${response.data.data.overview.read}`);
      }

      return {
        name: 'Get Notification Statistics',
        passed: response.data.success,
        details: response.data.success ? response.data.data.overview : undefined
      };
    } catch (error: any) {
      return {
        name: 'Get Notification Statistics',
        passed: false,
        error: error.message
      };
    }
  }

  private async testDeleteNotification(): Promise<TestResult> {
    try {
      console.log('🗑️ Testing Delete Notification...');

      if (!this.testNotificationId) {
        return {
          name: 'Delete Notification',
          passed: false,
          error: 'No test notification ID available'
        };
      }

      const response = await axios.delete(
        `${BASE_URL}/api/v1/notifications/${this.testNotificationId}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        }
      );

      if (response.data.success) {
        console.log('✅ Notification deleted successfully');
      }

      return {
        name: 'Delete Notification',
        passed: response.data.success,
        details: response.data.success ? { notificationId: this.testNotificationId } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Delete Notification',
        passed: false,
        error: error.message
      };
    }
  }

  private async testAdminCreateNotification(): Promise<TestResult> {
    try {
      console.log('👑 Testing Admin Create Notification...');

      const notificationData = {
        userId: this.testUserId,
        type: 'system',
        title: 'Admin Test Notification',
        message: 'This is a test notification created by admin.',
        priority: 'high',
        category: 'info'
      };

      const response = await axios.post(`${BASE_URL}/api/v1/notifications`, notificationData, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        console.log('✅ Admin notification created successfully');
      }

      return {
        name: 'Admin Create Notification',
        passed: response.data.success,
        details: response.data.success ? { notificationId: response.data.data.notification._id } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Admin Create Notification',
        passed: false,
        error: error.message
      };
    }
  }

  private async testBulkCreateNotifications(): Promise<TestResult> {
    try {
      console.log('📦 Testing Bulk Create Notifications...');

      const notifications = [
        {
          userId: this.testUserId,
          type: 'job_alert',
          title: 'New Job Alert 1',
          message: 'A new job matching your profile has been posted.',
          priority: 'medium',
          category: 'info'
        },
        {
          userId: this.testUserId,
          type: 'subscription',
          title: 'Subscription Update',
          message: 'Your subscription has been updated.',
          priority: 'low',
          category: 'success'
        }
      ];

      const response = await axios.post(`${BASE_URL}/api/v1/notifications/bulk`, {
        notifications
      }, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        console.log(`✅ Bulk notifications created: ${response.data.data.count}`);
      }

      return {
        name: 'Bulk Create Notifications',
        passed: response.data.success,
        details: response.data.success ? { count: response.data.data.count } : undefined
      };
    } catch (error: any) {
      return {
        name: 'Bulk Create Notifications',
        passed: false,
        error: error.message
      };
    }
  }

  private async testNotificationFiltering(): Promise<TestResult> {
    try {
      console.log('🔍 Testing Notification Filtering...');

      // Test filtering by type
      const typeResponse = await axios.get(`${BASE_URL}/api/v1/notifications?type=system`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      // Test filtering by priority
      const priorityResponse = await axios.get(`${BASE_URL}/api/v1/notifications?priority=high`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      // Test filtering by read status
      const readResponse = await axios.get(`${BASE_URL}/api/v1/notifications?isRead=false`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      const allPassed = typeResponse.data.success && priorityResponse.data.success && readResponse.data.success;

      if (allPassed) {
        console.log('✅ Notification filtering working correctly');
      }

      return {
        name: 'Notification Filtering',
        passed: allPassed,
        details: {
          typeFilter: typeResponse.data.success,
          priorityFilter: priorityResponse.data.success,
          readFilter: readResponse.data.success
        }
      };
    } catch (error: any) {
      return {
        name: 'Notification Filtering',
        passed: false,
        error: error.message
      };
    }
  }
}

// Run the tests
const tester = new NotificationSystemTester();
tester.runTests().catch(console.error);
