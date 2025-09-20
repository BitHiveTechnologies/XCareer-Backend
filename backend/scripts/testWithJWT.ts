import axios from 'axios';
import readline from 'readline';

const BASE_URL = 'http://localhost:3000';
const API_VERSION = '/api/v1';

interface TestResult {
    name: string;
    endpoint: string;
    method: string;
    status: number | string;
    success: boolean;
    error?: string;
}

interface JWTToken {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

async function generateJWTToken(role: 'user' | 'admin' | 'super_admin' = 'user'): Promise<JWTToken> {
    try {
        const response = await axios.post(`${BASE_URL}${API_VERSION}/jwt-auth/login`, {
            email: `${role}@example.com`,
            role: role,
            firstName: role.charAt(0).toUpperCase() + role.slice(1),
            lastName: 'User'
        });

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error('Failed to generate JWT token');
        }
    } catch (error: any) {
        throw new Error(`Error generating JWT token: ${error.message}`);
    }
}

async function runTests() {
    const results: TestResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    console.log('🚀 JWT AUTHENTICATION TESTING SCRIPT');
    console.log('====================================');
    console.log('This script tests all endpoints with JWT authentication.\n');

    console.log('🌐 Testing Public Endpoints (No Auth Required)');
    console.log('===============================================');

    // Public Endpoints
    await testEndpoint('Health Check', '/health', 'GET', results);
    await testEndpoint('API Documentation', `${API_VERSION}`, 'GET', results);
    await testEndpoint('Get Jobs', `${API_VERSION}/jobs?limit=10`, 'GET', results);
    await testEndpoint('Search Jobs', `${API_VERSION}/jobs/search?q=engineer`, 'GET', results);

    console.log('\n🔑 Generating JWT Tokens...');
    
    // Generate tokens for different roles
    let userToken: JWTToken;
    let adminToken: JWTToken;
    
    try {
        userToken = await generateJWTToken('user');
        console.log(`✅ User token generated for: ${userToken.user.email}`);
        
        adminToken = await generateJWTToken('admin');
        console.log(`✅ Admin token generated for: ${adminToken.user.email}`);
    } catch (error: any) {
        console.error(`❌ Failed to generate tokens: ${error.message}`);
        console.log('Please ensure the backend server is running and JWT auth routes are accessible.');
        return;
    }

    console.log('\n🔐 Testing Authenticated Endpoints (User Role)');
    console.log('===============================================');
    const userHeaders = {
        Authorization: `Bearer ${userToken.token}`,
        'Content-Type': 'application/json',
    };

    // Authenticated Endpoints (User)
    await testEndpoint('Get Current User (JWT)', `${API_VERSION}/jwt-auth/me`, 'GET', results, userHeaders);
    await testEndpoint('Update User Profile', `${API_VERSION}/users/profile`, 'PUT', results, userHeaders, {
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        dateOfBirth: "1995-01-01",
        qualification: "B.Tech",
        stream: "CSE",
        yearOfPassout: 2023,
        cgpaOrPercentage: 8.5,
        collegeName: "MIT"
    });
    await testEndpoint('Get Profile Completion', `${API_VERSION}/users/profile/completion`, 'GET', results, userHeaders);
    await testEndpoint('Get Subscription Plans', `${API_VERSION}/subscriptions/plans`, 'GET', results, userHeaders);
    await testEndpoint('Get Subscription Status', `${API_VERSION}/subscriptions/status`, 'GET', results, userHeaders);
    await testEndpoint('Get Payment History', `${API_VERSION}/payments/history`, 'GET', results, userHeaders);
    await testEndpoint('Get Job Applications', `${API_VERSION}/applications`, 'GET', results, userHeaders);
    await testEndpoint('Get Job Recommendations', `${API_VERSION}/matching/recommendations?limit=5`, 'GET', results, userHeaders);
    await testEndpoint('Get Matching Analytics', `${API_VERSION}/matching/analytics`, 'GET', results, userHeaders);
    await testEndpoint('Get Notifications', `${API_VERSION}/notifications`, 'GET', results, userHeaders);

    console.log('\n👑 Testing Admin Endpoints (Admin Role)');
    console.log('=======================================');
    const adminHeaders = {
        Authorization: `Bearer ${adminToken.token}`,
        'Content-Type': 'application/json',
    };

    // Admin Endpoints
    await testEndpoint('Admin Dashboard', `${API_VERSION}/admin/dashboard`, 'GET', results, adminHeaders);
    await testEndpoint('Dashboard Stats', `${API_VERSION}/admin/dashboard/stats`, 'GET', results, adminHeaders);
    await testEndpoint('Admin Users', `${API_VERSION}/admin/users?limit=10`, 'GET', results, adminHeaders);
    await testEndpoint('Admin Jobs', `${API_VERSION}/admin/jobs?limit=10`, 'GET', results, adminHeaders);

    console.log('\n📊 TESTING REPORT');
    console.log('==================');
    results.forEach(result => {
        if (result.success) {
            passedCount++;
            console.log(`✅ ${result.name}`);
        } else {
            failedCount++;
            console.log(`❌ ${result.name}`);
            console.log(`   ${result.method} ${result.endpoint} - ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
    });

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`✅ Successful: ${passedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`Success Rate: ${((passedCount / results.length) * 100).toFixed(1)}%`);

    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
        console.log(`   ${result.method} ${result.endpoint} - ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    });

    console.log('\n🎯 Recommendations:');
    if (failedCount > 0) {
        console.log('- Review failed endpoints and their logs.');
        console.log('- Ensure the backend server is running and accessible.');
        console.log('- Verify JWT authentication middleware is working correctly.');
        console.log('- Check endpoint paths and request bodies/headers for correctness.');
    } else {
        console.log('🎉 All tests passed! Your JWT authentication system is working perfectly.');
    }

    console.log('\n🔑 JWT Token Information:');
    console.log(`User Token: ${userToken.token.substring(0, 50)}...`);
    console.log(`Admin Token: ${adminToken.token.substring(0, 50)}...`);
    console.log('\n🎉 JWT Testing complete! Check the report above for details.\n');
}

async function testEndpoint(
    name: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    results: TestResult[],
    headers?: Record<string, string>,
    data?: object
) {
    try {
        const url = path.startsWith('/health') ? `${BASE_URL}${path}` : `${BASE_URL}${path}`;
        const response = await axios({
            method,
            url,
            headers,
            data,
            validateStatus: (status) => status >= 200 && status < 500, // Don't throw on 4xx errors
        });
        results.push({
            name,
            endpoint: path,
            method,
            status: response.status,
            success: response.status >= 200 && response.status < 300,
        });
        console.log(`✅ ${name} - ${response.status}`);
    } catch (error: any) {
        results.push({
            name,
            endpoint: path,
            method,
            status: error.response?.status || 'Network Error',
            success: false,
            error: error.message,
        });
        console.log(`❌ ${name} - ${error.response?.status || 'Error'}`);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});

