import axios from 'axios';
import { logger } from '../src/utils/logger';

/**
 * Comprehensive RBAC System Test Suite
 * Tests role-based access control functionality
 */

const BASE_URL = 'http://localhost:3001';
let authToken = '';
let adminToken = '';

/**
 * Helper function to make authenticated requests
 */
async function makeAuthenticatedRequest(method: string, endpoint: string, data?: any, token?: string) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token || authToken}`,
      'Content-Type': 'application/json'
    },
    data
  };

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

/**
 * Helper function to make unauthenticated requests
 */
async function makeUnauthenticatedRequest(method: string, endpoint: string, data?: any) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data
  };

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

/**
 * Get authentication token
 */
async function getAuthToken(): Promise<boolean> {
  try {
    logger.info('🔐 Getting authentication token...');
    
    // Try to login with existing user
    const loginResponse = await makeUnauthenticatedRequest('POST', '/api/v1/auth/login', {
      email: 'john.doe@example.com',
      password: 'JohnDoe123!'
    });

    if (loginResponse.success && loginResponse.data?.data?.accessToken) {
      authToken = loginResponse.data.data.accessToken;
      logger.info('✅ User authentication token obtained');
      return true;
    }

    // If login fails, try to register a new user
    logger.info('📝 Registering new user...');
    const registerResponse = await makeUnauthenticatedRequest('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestUser123!',
      mobile: '9876543210',
      qualification: 'B.Tech',
      stream: 'Computer Science',
      yearOfPassout: '2023',
      cgpaOrPercentage: '8.5'
    });

    if (registerResponse.success && registerResponse.data?.data?.accessToken) {
      authToken = registerResponse.data.data.accessToken;
      logger.info('✅ User registered and authenticated');
      return true;
    }

    logger.error('❌ Failed to get authentication token');
    return false;
  } catch (error) {
    logger.error('❌ Authentication failed', { error });
    return false;
  }
}

/**
 * Get admin authentication token
 */
async function getAdminToken(): Promise<boolean> {
  try {
    logger.info('🔐 Getting admin authentication token...');
    
    // Try to login with existing admin
    const loginResponse = await makeUnauthenticatedRequest('POST', '/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    if (loginResponse.success && loginResponse.data?.data?.accessToken) {
      adminToken = loginResponse.data.data.accessToken;
      logger.info('✅ Admin authentication token obtained');
      return true;
    }

    // If login fails, try to register a new admin
    logger.info('📝 Registering new admin...');
    const registerResponse = await makeUnauthenticatedRequest('POST', '/api/v1/auth/register', {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123!',
      mobile: '9876543211',
      qualification: 'M.Tech',
      stream: 'Computer Science',
      yearOfPassout: '2020',
      cgpaOrPercentage: '9.0',
      role: 'admin'
    });

    if (registerResponse.success && registerResponse.data?.data?.accessToken) {
      adminToken = registerResponse.data.data.accessToken;
      logger.info('✅ Admin registered and authenticated');
      return true;
    }

    logger.error('❌ Failed to get admin authentication token');
    return false;
  } catch (error) {
    logger.error('❌ Admin authentication failed', { error });
    return false;
  }
}

/**
 * Test 1: Get User Permissions
 */
async function testGetUserPermissions(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Get User Permissions...');
    
    const response = await makeAuthenticatedRequest('GET', '/api/v1/rbac/permissions');
    
    if (response.success && response.data?.data?.permissions) {
      logger.info('✅ Get User Permissions | Permissions retrieved successfully');
      logger.info(`   - Role: ${response.data.data.user.role}`);
      logger.info(`   - Permissions: ${response.data.data.permissions.length} permissions`);
      logger.info(`   - Capabilities: ${Object.keys(response.data.data.capabilities).length} capabilities`);
      return true;
    } else {
      logger.error('❌ Get User Permissions | Failed to get permissions');
      return false;
    }
  } catch (error) {
    logger.error('❌ Get User Permissions | Test failed', { error });
    return false;
  }
}

/**
 * Test 2: Check Specific Permission
 */
async function testCheckPermission(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Check Permission...');
    
    const response = await makeAuthenticatedRequest('POST', '/api/v1/rbac/check-permission', {
      resource: 'profile',
      action: 'read'
    });
    
    if (response.success && response.data?.data?.hasPermission !== undefined) {
      logger.info('✅ Check Permission | Permission check completed');
      logger.info(`   - Has Permission: ${response.data.data.hasPermission}`);
      logger.info(`   - Validation: ${response.data.data.validation.allowed ? 'Allowed' : 'Denied'}`);
      return true;
    } else {
      logger.error('❌ Check Permission | Failed to check permission');
      return false;
    }
  } catch (error) {
    logger.error('❌ Check Permission | Test failed', { error });
    return false;
  }
}

/**
 * Test 3: Get Roles and Permissions (Admin Only)
 */
async function testGetRolesAndPermissions(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Get Roles and Permissions (Admin Only)...');
    
    const response = await makeAuthenticatedRequest('GET', '/api/v1/rbac/roles', undefined, adminToken);
    
    if (response.success && response.data?.data?.roles) {
      logger.info('✅ Get Roles and Permissions | Roles retrieved successfully');
      logger.info(`   - Available Roles: ${response.data.data.availableRoles.join(', ')}`);
      logger.info(`   - Available Plans: ${response.data.data.availablePlans.join(', ')}`);
      return true;
    } else {
      logger.error('❌ Get Roles and Permissions | Failed to get roles');
      return false;
    }
  } catch (error) {
    logger.error('❌ Get Roles and Permissions | Test failed', { error });
    return false;
  }
}

/**
 * Test 4: Get Subscription Limits
 */
async function testGetSubscriptionLimits(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Get Subscription Limits...');
    
    const response = await makeAuthenticatedRequest('GET', '/api/v1/rbac/limits');
    
    if (response.success && response.data?.data?.limits) {
      logger.info('✅ Get Subscription Limits | Limits retrieved successfully');
      logger.info(`   - Subscription Plan: ${response.data.data.subscriptionPlan || 'None'}`);
      logger.info(`   - Has Active Subscription: ${response.data.data.hasActiveSubscription}`);
      logger.info(`   - Limits: ${Object.keys(response.data.data.limits).length} limits configured`);
      return true;
    } else {
      logger.error('❌ Get Subscription Limits | Failed to get limits');
      return false;
    }
  } catch (error) {
    logger.error('❌ Get Subscription Limits | Test failed', { error });
    return false;
  }
}

/**
 * Test 5: Validate Access
 */
async function testValidateAccess(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Validate Access...');
    
    const response = await makeAuthenticatedRequest('POST', '/api/v1/rbac/validate-access', {
      resource: 'jobs',
      action: 'read'
    });
    
    if (response.success && response.data?.data?.validation) {
      logger.info('✅ Validate Access | Access validation completed');
      logger.info(`   - Access Allowed: ${response.data.data.validation.allowed}`);
      logger.info(`   - Reason: ${response.data.data.validation.reason || 'N/A'}`);
      return true;
    } else {
      logger.error('❌ Validate Access | Failed to validate access');
      return false;
    }
  } catch (error) {
    logger.error('❌ Validate Access | Test failed', { error });
    return false;
  }
}

/**
 * Test 6: Unauthorized Access
 */
async function testUnauthorizedAccess(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Unauthorized Access...');
    
    const response = await makeUnauthenticatedRequest('GET', '/api/v1/rbac/permissions');
    
    if (!response.success && response.status === 401) {
      logger.info('✅ Unauthorized Access | Correctly rejected no token');
      return true;
    } else {
      logger.error('❌ Unauthorized Access | Should have been rejected');
      return false;
    }
  } catch (error) {
    logger.error('❌ Unauthorized Access | Test failed', { error });
    return false;
  }
}

/**
 * Test 7: Admin Only Endpoint with User Token
 */
async function testAdminOnlyEndpoint(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Admin Only Endpoint with User Token...');
    
    const response = await makeAuthenticatedRequest('GET', '/api/v1/rbac/roles');
    
    if (!response.success && response.status === 403) {
      logger.info('✅ Admin Only Endpoint | Correctly rejected user token');
      return true;
    } else {
      logger.error('❌ Admin Only Endpoint | Should have been rejected');
      return false;
    }
  } catch (error) {
    logger.error('❌ Admin Only Endpoint | Test failed', { error });
    return false;
  }
}

/**
 * Test 8: Invalid Permission Check
 */
async function testInvalidPermissionCheck(): Promise<boolean> {
  try {
    logger.info('🧪 Testing Invalid Permission Check...');
    
    const response = await makeAuthenticatedRequest('POST', '/api/v1/rbac/check-permission', {
      resource: '', // Invalid resource
      action: ''   // Invalid action
    });
    
    if (!response.success && response.status === 400) {
      logger.info('✅ Invalid Permission Check | Correctly rejected invalid data');
      return true;
    } else {
      logger.error('❌ Invalid Permission Check | Should have been rejected');
      return false;
    }
  } catch (error) {
    logger.error('❌ Invalid Permission Check | Test failed', { error });
    return false;
  }
}

/**
 * Main test function
 */
async function testRBACSystem(): Promise<void> {
  logger.info('🚀 Starting Comprehensive RBAC System Test Suite...');

  try {
    // Get authentication tokens
    const userAuthSuccess = await getAuthToken();
    const adminAuthSuccess = await getAdminToken();

    if (!userAuthSuccess) {
      logger.error('❌ Failed to get user authentication token');
      return;
    }

    if (!adminAuthSuccess) {
      logger.error('❌ Failed to get admin authentication token');
      return;
    }

    // Run tests
    const tests = [
      { name: 'Get User Permissions', fn: testGetUserPermissions },
      { name: 'Check Specific Permission', fn: testCheckPermission },
      { name: 'Get Roles and Permissions (Admin)', fn: testGetRolesAndPermissions },
      { name: 'Get Subscription Limits', fn: testGetSubscriptionLimits },
      { name: 'Validate Access', fn: testValidateAccess },
      { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
      { name: 'Admin Only Endpoint', fn: testAdminOnlyEndpoint },
      { name: 'Invalid Permission Check', fn: testInvalidPermissionCheck },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error(`❌ ${test.name} | Test failed with error`, { error });
        failed++;
      }
    }

    // Test Results Summary
    logger.info('\n📊 RBAC System Test Results Summary:');
    logger.info(`Total Tests: ${tests.length}`);
    logger.info(`Passed: ${passed}`);
    logger.info(`Failed: ${failed}`);
    logger.info(`Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);

    if (failed === 0) {
      logger.info('🎉 All RBAC system tests passed successfully!');
    } else {
      logger.warn(`⚠️ ${failed} tests failed. Please review the implementation.`);
    }

  } catch (error) {
    logger.error('❌ RBAC system test suite failed', { error });
  }
}

// Run the tests
testRBACSystem().catch(error => {
  logger.error('❌ Test suite execution failed', { error });
  process.exit(1);
});
