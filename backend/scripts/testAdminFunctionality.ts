import axios from 'axios';
import { logger } from '../src/utils/logger';

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
  data?: any
) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${API_VERSION}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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

// Test admin authentication
async function testAdminAuthentication() {
  logger.info('\n🧪 Testing Admin Authentication...');
  
  // Test 1: Login with super admin credentials
  try {
    const loginResponse = await axios.post(`${BASE_URL}${API_VERSION}/admin/login`, {
      email: 'superadmin@notifyx.com',
      password: 'SuperAdmin123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      logTestResult('Super Admin Login', true);
      return loginResponse.data.data.token;
    } else {
      logTestResult('Super Admin Login', false, loginResponse.data);
      return null;
    }
  } catch (error: any) {
    logTestResult('Super Admin Login', false, error.response?.data || error.message);
    return null;
  }
}

// Test admin dashboard functionality
async function testAdminDashboard(token: string) {
  logger.info('\n🧪 Testing Admin Dashboard...');
  
  // Test dashboard stats
  const statsResponse = await makeAuthenticatedRequest('GET', '/admin/dashboard/stats', token);
  if (statsResponse.success && statsResponse.data.success) {
    logTestResult('Get Dashboard Stats', true);
  } else {
    logTestResult('Get Dashboard Stats', false, statsResponse.error);
  }
  
  // Test user analytics
  const userAnalyticsResponse = await makeAuthenticatedRequest('GET', '/admin/dashboard/user-analytics?period=30d', token);
  if (userAnalyticsResponse.success && userAnalyticsResponse.data.success) {
    logTestResult('Get User Analytics', true);
  } else {
    logTestResult('Get User Analytics', false, userAnalyticsResponse.error);
  }
  
  // Test job analytics
  const jobAnalyticsResponse = await makeAuthenticatedRequest('GET', '/admin/dashboard/job-analytics', token);
  if (jobAnalyticsResponse.success && jobAnalyticsResponse.data.success) {
    logTestResult('Get Job Analytics', true);
  } else {
    logTestResult('Get Job Analytics', false, jobAnalyticsResponse.error);
  }
  
  // Test system health
  const systemHealthResponse = await makeAuthenticatedRequest('GET', '/admin/dashboard/system-health', token);
  if (systemHealthResponse.success && systemHealthResponse.data.success) {
    logTestResult('Get System Health', true);
  } else {
    logTestResult('Get System Health', false, systemHealthResponse.error);
  }
}

// Test user management functionality
async function testUserManagement(token: string) {
  logger.info('\n🧪 Testing User Management...');
  
  // Test get all users
  const getAllUsersResponse = await makeAuthenticatedRequest('GET', '/admin/users?limit=10', token);
  if (getAllUsersResponse.success && getAllUsersResponse.data.success) {
    logTestResult('Get All Users', true);
  } else {
    logTestResult('Get All Users', false, getAllUsersResponse.error);
  }
  
  // Test get user by ID (if users exist)
  if (getAllUsersResponse.success && getAllUsersResponse.data.success && getAllUsersResponse.data.data.users.length > 0) {
    const userId = getAllUsersResponse.data.data.users[0]._id;
    const getUserByIdResponse = await makeAuthenticatedRequest('GET', `/admin/users/${userId}`, token);
    if (getUserByIdResponse.success && getUserByIdResponse.data.success) {
      logTestResult('Get User By ID', true);
    } else {
      logTestResult('Get User By ID', false, getUserByIdResponse.error);
    }
    
    // Test update user role
    const updateUserResponse = await makeAuthenticatedRequest('PUT', `/admin/users/${userId}`, token, {
      role: 'user',
      isActive: true
    });
    if (updateUserResponse.success && updateUserResponse.data.success) {
      logTestResult('Update User Role', true);
    } else {
      logTestResult('Update User Role', false, updateUserResponse.error);
    }
    
    // Test get user activity
    const userActivityResponse = await makeAuthenticatedRequest('GET', `/admin/users/${userId}/activity`, token);
    if (userActivityResponse.success && userActivityResponse.data.success) {
      logTestResult('Get User Activity', true);
    } else {
      logTestResult('Get User Activity', false, userActivityResponse.error);
    }
  }
  
  // Test bulk update users
  if (getAllUsersResponse.success && getAllUsersResponse.data.success && getAllUsersResponse.data.data.users.length > 0) {
    const userIds = getAllUsersResponse.data.data.users.slice(0, 2).map((user: any) => user._id);
    const bulkUpdateResponse = await makeAuthenticatedRequest('POST', '/admin/users/bulk-update', token, {
      userIds,
      updates: {
        isActive: true
      }
    });
    if (bulkUpdateResponse.success && bulkUpdateResponse.data.success) {
      logTestResult('Bulk Update Users', true);
    } else {
      logTestResult('Bulk Update Users', false, bulkUpdateResponse.error);
    }
  }
}

// Test job management functionality
async function testJobManagement(token: string) {
  logger.info('\n🧪 Testing Job Management...');
  
  // Test get all jobs
  const getAllJobsResponse = await makeAuthenticatedRequest('GET', '/admin/jobs?limit=10', token);
  if (getAllJobsResponse.success && getAllJobsResponse.data.success) {
    logTestResult('Get All Jobs', true);
  } else {
    logTestResult('Get All Jobs', false, getAllJobsResponse.error);
  }
  
  // Test get job by ID (if jobs exist)
  if (getAllJobsResponse.success && getAllJobsResponse.data.success && getAllJobsResponse.data.data.jobs.length > 0) {
    const jobId = getAllJobsResponse.data.data.jobs[0]._id;
    const getJobByIdResponse = await makeAuthenticatedRequest('GET', `/admin/jobs/${jobId}`, token);
    if (getJobByIdResponse.success && getJobByIdResponse.data.success) {
      logTestResult('Get Job By ID', true);
    } else {
      logTestResult('Get Job By ID', false, getJobByIdResponse.error);
    }
    
    // Test update job status
    const updateJobResponse = await makeAuthenticatedRequest('PUT', `/admin/jobs/${jobId}`, token, {
      status: 'approved',
      isActive: true,
      moderationNotes: 'Job approved after review'
    });
    if (updateJobResponse.success && updateJobResponse.data.success) {
      logTestResult('Update Job Status', true);
    } else {
      logTestResult('Update Job Status', false, updateJobResponse.error);
    }
    
    // Test get job application analytics
    const jobAnalyticsResponse = await makeAuthenticatedRequest('GET', `/admin/jobs/${jobId}/applications/analytics`, token);
    if (jobAnalyticsResponse.success && jobAnalyticsResponse.data.success) {
      logTestResult('Get Job Application Analytics', true);
    } else {
      logTestResult('Get Job Application Analytics', false, jobAnalyticsResponse.error);
    }
  }
  
  // Test get moderation queue
  const moderationQueueResponse = await makeAuthenticatedRequest('GET', '/admin/jobs/moderation/queue', token);
  if (moderationQueueResponse.success && moderationQueueResponse.data.success) {
    logTestResult('Get Moderation Queue', true);
  } else {
    logTestResult('Get Moderation Queue', false, moderationQueueResponse.error);
  }
  
  // Test bulk update jobs
  if (getAllJobsResponse.success && getAllJobsResponse.data.success && getAllJobsResponse.data.data.jobs.length > 0) {
    const jobIds = getAllJobsResponse.data.data.jobs.slice(0, 2).map((job: any) => job._id);
    const bulkUpdateResponse = await makeAuthenticatedRequest('POST', '/admin/jobs/bulk-update', token, {
      jobIds,
      updates: {
        isActive: true
      }
    });
    if (bulkUpdateResponse.success && bulkUpdateResponse.data.success) {
      logTestResult('Bulk Update Jobs', true);
    } else {
      logTestResult('Bulk Update Jobs', false, bulkUpdateResponse.error);
    }
  }
}

// Test subscription management functionality
async function testSubscriptionManagement(token: string) {
  logger.info('\n🧪 Testing Subscription Management...');
  
  // Test get all subscriptions
  const getAllSubscriptionsResponse = await makeAuthenticatedRequest('GET', '/admin/subscriptions?limit=10', token);
  if (getAllSubscriptionsResponse.success && getAllSubscriptionsResponse.data.success) {
    logTestResult('Get All Subscriptions', true);
  } else {
    logTestResult('Get All Subscriptions', false, getAllSubscriptionsResponse.error);
  }
  
  // Test get subscription by ID (if subscriptions exist)
  if (getAllSubscriptionsResponse.success && getAllSubscriptionsResponse.data.success && getAllSubscriptionsResponse.data.data.subscriptions.length > 0) {
    const subscriptionId = getAllSubscriptionsResponse.data.data.subscriptions[0]._id;
    const getSubscriptionByIdResponse = await makeAuthenticatedRequest('GET', `/admin/subscriptions/${subscriptionId}`, token);
    if (getSubscriptionByIdResponse.success && getSubscriptionByIdResponse.data.success) {
      logTestResult('Get Subscription By ID', true);
    } else {
      logTestResult('Get Subscription By ID', false, getSubscriptionByIdResponse.error);
    }
    
    // Test update subscription
    const updateSubscriptionResponse = await makeAuthenticatedRequest('PUT', `/admin/subscriptions/${subscriptionId}`, token, {
      status: 'active',
      isActive: true,
      adminNotes: 'Subscription updated by admin'
    });
    if (updateSubscriptionResponse.success && updateSubscriptionResponse.data.success) {
      logTestResult('Update Subscription', true);
    } else {
      logTestResult('Update Subscription', false, updateSubscriptionResponse.error);
    }
    
    // Test cancel subscription
    const cancelSubscriptionResponse = await makeAuthenticatedRequest('POST', `/admin/subscriptions/${subscriptionId}/cancel`, token, {
      reason: 'Testing cancellation functionality'
    });
    if (cancelSubscriptionResponse.success && cancelSubscriptionResponse.data.success) {
      logTestResult('Cancel Subscription', true);
    } else {
      logTestResult('Cancel Subscription', false, cancelSubscriptionResponse.error);
    }
  }
  
  // Test get subscription analytics
  const subscriptionAnalyticsResponse = await makeAuthenticatedRequest('GET', '/admin/subscriptions/analytics', token);
  if (subscriptionAnalyticsResponse.success && subscriptionAnalyticsResponse.data.success) {
    logTestResult('Get Subscription Analytics', true);
  } else {
    logTestResult('Get Subscription Analytics', false, subscriptionAnalyticsResponse.error);
  }
  
  // Test bulk update subscriptions
  if (getAllSubscriptionsResponse.success && getAllSubscriptionsResponse.data.success && getAllSubscriptionsResponse.data.data.subscriptions.length > 0) {
    const subscriptionIds = getAllSubscriptionsResponse.data.data.subscriptions.slice(0, 2).map((sub: any) => sub._id);
    const bulkUpdateResponse = await makeAuthenticatedRequest('POST', '/admin/subscriptions/bulk-update', token, {
      subscriptionIds,
      updates: {
        isActive: true
      }
    });
    if (bulkUpdateResponse.success && bulkUpdateResponse.data.success) {
      logTestResult('Bulk Update Subscriptions', true);
    } else {
      logTestResult('Bulk Update Subscriptions', false, bulkUpdateResponse.error);
    }
  }
}

// Test audit log functionality
async function testAuditLogs(token: string) {
  logger.info('\n🧪 Testing Audit Logs...');
  
  // Test get audit logs
  const getAuditLogsResponse = await makeAuthenticatedRequest('GET', '/admin/audit-logs?limit=20', token);
  if (getAuditLogsResponse.success && getAuditLogsResponse.data.success) {
    logTestResult('Get Audit Logs', true);
  } else {
    logTestResult('Get Audit Logs', false, getAuditLogsResponse.error);
  }
  
  // Test get recent activity
  const getRecentActivityResponse = await makeAuthenticatedRequest('GET', '/admin/audit-logs/recent', token);
  if (getRecentActivityResponse.success && getRecentActivityResponse.data.success) {
    logTestResult('Get Recent Activity', true);
  } else {
    logTestResult('Get Recent Activity', false, getRecentActivityResponse.error);
  }
  
  // Test export audit logs
  const exportAuditLogsResponse = await makeAuthenticatedRequest('GET', '/admin/audit-logs/export', token);
  if (exportAuditLogsResponse.success && exportAuditLogsResponse.data.success) {
    logTestResult('Export Audit Logs', true);
  } else {
    logTestResult('Export Audit Logs', false, exportAuditLogsResponse.error);
  }
}

// Test different admin roles
async function testAdminRoles() {
  logger.info('\n🧪 Testing Different Admin Roles...');
  
  // Test admin role (moderator)
  try {
    const adminLoginResponse = await axios.post(`${BASE_URL}${API_VERSION}/admin/login`, {
      email: 'moderator@notifyx.com',
      password: 'Moderator123!'
    });
    
    if (adminLoginResponse.status === 200 && adminLoginResponse.data.success) {
      const adminToken = adminLoginResponse.data.data.token;
      
      // Test that moderator can access job management
      const jobsResponse = await makeAuthenticatedRequest('GET', '/admin/jobs?limit=5', adminToken);
      if (jobsResponse.success && jobsResponse.data.success) {
        logTestResult('Moderator Job Access', true);
      } else {
        logTestResult('Moderator Job Access', false, jobsResponse.error);
      }
      
      // Test that moderator cannot access user management (should fail)
      const usersResponse = await makeAuthenticatedRequest('GET', '/admin/users?limit=5', adminToken);
      if (!usersResponse.success || usersResponse.status === 403) {
        logTestResult('Moderator User Access Restricted', true);
      } else {
        logTestResult('Moderator User Access Restricted', false, 'Moderator was able to access user management');
      }
    } else {
      logTestResult('Moderator Login', false, adminLoginResponse.data);
    }
  } catch (error: any) {
    logTestResult('Moderator Login', false, error.response?.data || error.message);
  }
}

// Test error handling and validation
async function testErrorHandling(token: string) {
  logger.info('\n🧪 Testing Error Handling and Validation...');
  
  // Test invalid user ID
  const invalidUserIdResponse = await makeAuthenticatedRequest('GET', '/admin/users/invalid-id', token);
  if (!invalidUserIdResponse.success && invalidUserIdResponse.status === 400) {
    logTestResult('Invalid User ID Validation', true);
  } else {
    logTestResult('Invalid User ID Validation', false, 'Should have returned 400 for invalid ID');
  }
  
  // Test invalid job ID
  const invalidJobIdResponse = await makeAuthenticatedRequest('GET', '/admin/jobs/invalid-id', token);
  if (!invalidJobIdResponse.success && invalidJobIdResponse.status === 400) {
    logTestResult('Invalid Job ID Validation', true);
  } else {
    logTestResult('Invalid Job ID Validation', false, 'Should have returned 400 for invalid ID');
  }
  
  // Test invalid subscription ID
  const invalidSubscriptionIdResponse = await makeAuthenticatedRequest('GET', '/admin/subscriptions/invalid-id', token);
  if (!invalidSubscriptionIdResponse.success && invalidSubscriptionIdResponse.status === 400) {
    logTestResult('Invalid Subscription ID Validation', true);
  } else {
    logTestResult('Invalid Subscription ID Validation', false, 'Should have returned 400 for invalid ID');
  }
  
  // Test invalid update data
  if (getAllUsersResponse.success && getAllUsersResponse.data.success && getAllUsersResponse.data.data.users.length > 0) {
    const userId = getAllUsersResponse.data.data.users[0]._id;
    const invalidUpdateResponse = await makeAuthenticatedRequest('PUT', `/admin/users/${userId}`, token, {
      role: 'invalid_role'
    });
    if (!invalidUpdateResponse.success && invalidUpdateResponse.status === 400) {
      logTestResult('Invalid Update Data Validation', true);
    } else {
      logTestResult('Invalid Update Data Validation', false, 'Should have returned 400 for invalid role');
    }
  }
}

// Main test function
async function runAllTests() {
  logger.info('🚀 Starting Admin Functionality Tests...');
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info(`API Version: ${API_VERSION}`);
  
  try {
    // Test admin authentication
    const token = await testAdminAuthentication();
    if (!token) {
      logger.error('❌ Authentication failed. Cannot proceed with other tests.');
      return;
    }
    
    // Run all test suites
    await testAdminDashboard(token);
    await testUserManagement(token);
    await testJobManagement(token);
    await testSubscriptionManagement(token);
    await testAuditLogs(token);
    await testAdminRoles();
    await testErrorHandling(token);
    
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
      logger.info('\n🎉 All tests passed! Admin functionality is working correctly.');
    } else {
      logger.warn('\n⚠️  Some tests failed. Please check the details above.');
    }
    
  } catch (error) {
    logger.error('❌ Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      logger.info('Test execution completed');
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };




