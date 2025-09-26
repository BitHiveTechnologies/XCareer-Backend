import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

async function simpleTest() {
  console.log('🧪 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.status, response.data);
  } catch (error: any) {
    console.log('❌ Health Check Failed:', error.message);
  }

  console.log('\n🧪 Testing User Login...');
  try {
    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, {
      email: 'testuser123@example.com',
      password: 'TestPassword123!'
    });
    console.log('✅ User Login:', response.status, response.data.success);
  } catch (error: any) {
    console.log('❌ User Login Failed:', error.response?.data || error.message);
  }

  console.log('\n🧪 Testing Admin Login...');
  try {
    const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, {
      email: 'admin@notifyx.com',
      password: 'Admin123!'
    });
    console.log('✅ Admin Login:', response.status, response.data.success);
  } catch (error: any) {
    console.log('❌ Admin Login Failed:', error.response?.data || error.message);
  }
}

simpleTest().catch(console.error);
