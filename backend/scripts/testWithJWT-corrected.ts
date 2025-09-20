import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const API_VERSION = '/api/v1'; // Corrected: use /api/v1 as the full path

interface TestResult {
    name: string;
    endpoint: string;
    method: string;
    status: number | string;
    success: boolean;
    error?: string;
}

async function runTests() {
    const results: TestResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    console.log('🚀 JWT AUTHENTICATION TESTING SCRIPT (CORRECTED)');
    console.log('================================================');
    console.log('This script tests all endpoints with JWT authentication.\n');

    console.log('🌐 Testing Public Endpoints (No Auth Required)');
    console.log('===============================================');

    // Public Endpoints
    await testEndpoint('Health Check', '/health', 'GET', results);
    await testEndpoint('API Documentation', `${API_VERSION}`, 'GET', results);
    await testEndpoint('Get Jobs', `${API_VERSION}/jobs?limit=10`, 'GET', results);
    await testEndpoint('Search Jobs', `${API_VERSION}/jobs/search?q=engineer`, 'GET', results);

    console.log('\n🔑 Generating JWT Tokens...');
    let jwtToken = '';
    let adminJwtToken = '';

    try {
        // Generate User Token
        const userLoginResponse = await axios.post(`${BASE_URL}${API_VERSION}/jwt-auth/login`, {
            email: 'testuser@example.com',
            role: 'user',
            firstName: 'Test',
            lastName: 'User'
        });
        jwtToken = userLoginResponse.data.data.token;
        console.log('✅ User JWT Token Generated.');

        // Generate Admin Token
        const adminLoginResponse = await axios.post(`${BASE_URL}${API_VERSION}/jwt-auth/login`, {
            email: 'admin@example.com',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
        });
        adminJwtToken = adminLoginResponse.data.data.token;
        console.log('✅ Admin JWT Token Generated.');

    } catch (error: any) {
        console.error('❌ Failed to generate tokens: ' + (error.response?.data?.message || error.message));
        console.error('Please ensure the backend server is running and JWT auth routes are accessible.');
        return; // Exit if tokens cannot be generated
    }

    if (jwtToken) {
        console.log('\n🔐 Testing Authenticated Endpoints (User)');
        console.log('========================================');
        const authHeaders = {
            Authorization: `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
        };

        await testEndpoint('Get Current User (JWT)', `${API_VERSION}/jwt-auth/me`, 'GET', results, authHeaders);
            await testEndpoint('Update User Profile', `${API_VERSION}/users/me`, 'PUT', results, authHeaders, {
                name: 'Test User',
                mobile: '9876543210'
            });
            await testEndpoint('Complete User Profile', `${API_VERSION}/users/me`, 'PUT', results, authHeaders, {
                name: "John Doe",
                mobile: "9876543210",
                dateOfBirth: "1995-01-01",
                qualification: "B.Tech",
                stream: "CSE",
                yearOfPassout: 2023,
                cgpaOrPercentage: 8.5,
                collegeName: "MIT"
            });
            await testEndpoint('Get Profile Completion', `${API_VERSION}/users/me/completion`, 'GET', results, authHeaders);
        await testEndpoint('Get Subscription Plans', `${API_VERSION}/subscriptions/plans`, 'GET', results, authHeaders);
        await testEndpoint('Get Subscription Status', `${API_VERSION}/subscriptions/current`, 'GET', results, authHeaders);
        await testEndpoint('Get Payment History', `${API_VERSION}/payments/history`, 'GET', results, authHeaders);
        await testEndpoint('Get Job Applications', `${API_VERSION}/applications/my-applications`, 'GET', results, authHeaders);
        await testEndpoint('Get Job Recommendations', `${API_VERSION}/matching/recommendations?limit=5`, 'GET', results, authHeaders);
        await testEndpoint('Get Matching Analytics', `${API_VERSION}/matching/analytics`, 'GET', results, authHeaders);
        await testEndpoint('Get Notifications (Test Connection)', `${API_VERSION}/notifications/test-connection`, 'GET', results, authHeaders);

    } else {
        console.log('⏭️  Skipping authenticated user tests (no token provided)\n');
    }

    if (adminJwtToken) {
        console.log('\n👑 Testing Admin Endpoints');
        console.log('===========================');
        const adminAuthHeaders = {
            Authorization: `Bearer ${adminJwtToken}`,
            'Content-Type': 'application/json',
        };

        await testEndpoint('Admin Dashboard', `${API_VERSION}/admin/dashboard`, 'GET', results, adminAuthHeaders);
        await testEndpoint('Admin Analytics Users', `${API_VERSION}/admin/analytics/users`, 'GET', results, adminAuthHeaders);
        await testEndpoint('Admin Analytics Jobs', `${API_VERSION}/admin/analytics/jobs`, 'GET', results, adminAuthHeaders);
        await testEndpoint('Admin Health', `${API_VERSION}/admin/health`, 'GET', results, adminAuthHeaders);

        // Test some additional endpoints that might exist
        await testEndpoint('Admin Login', `${API_VERSION}/admin/login`, 'POST', results, {}, {
            email: 'admin@example.com',
            password: 'adminpassword123'
        });

    } else {
        console.log('⏭️  Skipping admin tests (no token provided)\n');
    }

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

    console.log('\n🎯 Recommendations:\n');
    if (failedCount > 0) {
        console.log('- Review failed endpoints and their logs.');
        console.log('- Ensure the backend server is running and accessible.');
        console.log('- Verify JWT_SECRET in environment variables matches the one used for token generation.');
        console.log('- Check endpoint paths and request bodies/headers for correctness.');
    } else {
        console.log('🎉 All tests passed! Your API seems to be in good shape.');
    }
    console.log('\n🎉 Testing complete! Check the report above for details.\n');
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
        // console.log(`✅ ${name} - ${response.status}`);
    } catch (error: any) {
        results.push({
            name,
            endpoint: path,
            method,
            status: error.response?.status || 'Network Error',
            success: false,
            error: error.message,
        });
        // console.log(`❌ ${name} - ${error.response?.status || 'Error'}`);
    }
}

runTests();
