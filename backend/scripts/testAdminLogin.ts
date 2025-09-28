#!/usr/bin/env ts-node

/**
 * Admin Login Test Script
 * 
 * This script tests admin login functionality using the provided credentials.
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3001';
const ADMIN_CREDENTIALS = {
  email: 'admin@notifyx.com',
  password: 'Admin123!'
};

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...\n');
  
  try {
    // Test admin login
    console.log('📧 Admin Email:', ADMIN_CREDENTIALS.email);
    console.log('🔑 Admin Password:', '***********');
    console.log(`🌐 Server URL: ${SERVER_URL}\n`);
    
    const loginResponse = await axios.post(`${SERVER_URL}/api/v1/auth/login`, {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });
    
    if (loginResponse.status === 200 && loginResponse.data.data && loginResponse.data.data.accessToken) {
      console.log('✅ Admin login successful!');
      console.log(`👤 User: ${loginResponse.data.data.user.name}`);
      console.log(`📧 Email: ${loginResponse.data.data.user.email}`);
      console.log(`🛡️  Role: ${loginResponse.data.data.user.role}`);
      console.log(`🔑 Token: ${loginResponse.data.data.accessToken.substring(0, 50)}...`);
      
      // Test admin endpoint access
      console.log('\n🧪 Testing admin endpoint access...');
      
      const adminToken = loginResponse.data.data.accessToken;
      const adminTestResponse = await axios.get(`${SERVER_URL}/api/v1/jobs/alerts/scheduler/status`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (adminTestResponse.status === 200) {
        console.log('✅ Admin endpoint access successful!');
        console.log('📊 Scheduler Status:', adminTestResponse.data);
        return adminToken;
      } else {
        console.log('❌ Admin endpoint access failed');
        return null;
      }
      
    } else {
      console.log('❌ Admin login failed - Invalid response');
      return null;
    }
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('❌ Admin login failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    } else {
      console.log('❌ Unexpected error:', error);
    }
    return null;
  }
}

async function testJobAlertEndpoints(adminToken: string) {
  console.log('\n🧪 Testing Job Alert API Endpoints...\n');
  
  try {
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Get job alert statistics
    console.log('1️⃣ Testing job alert statistics...');
    const statsResponse = await axios.get(`${SERVER_URL}/api/v1/jobs/alerts/statistics`, { headers });
    console.log('✅ Statistics endpoint working:', statsResponse.data);
    
    // Test 2: Get scheduler status
    console.log('\n2️⃣ Testing scheduler status...');
    const schedulerResponse = await axios.get(`${SERVER_URL}/api/v1/jobs/alerts/scheduler/status`, { headers });
    console.log('✅ Scheduler endpoint working:', schedulerResponse.data);
    
    console.log('\n✅ All admin endpoints are accessible!');
    return true;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('❌ Admin endpoint test failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    } else {
      console.log('❌ Unexpected error:', error);
    }
    return false;
  }
}

async function main() {
  console.log('🔑 Admin Login Test\n');
  console.log('===================\n');
  
  // Test admin login
  const adminToken = await testAdminLogin();
  
  if (adminToken) {
    // Test admin endpoints
    await testJobAlertEndpoints(adminToken);
    
    console.log('\n🎉 Admin login test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Admin credentials are working');
    console.log('2. ✅ Admin endpoints are accessible');
    console.log('3. 🚀 Ready to run full job alert flow test');
    console.log('\nRun: npm run test:job-alerts');
    
  } else {
    console.log('\n❌ Admin login test failed!');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the server is running on port 3001');
    console.log('2. Verify admin user exists in the database');
    console.log('3. Check admin credentials are correct');
    console.log('4. Review server logs for authentication errors');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { testAdminLogin, testJobAlertEndpoints };
