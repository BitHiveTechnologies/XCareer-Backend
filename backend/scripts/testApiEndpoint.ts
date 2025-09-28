import axios from 'axios';

async function testApiEndpoint() {
  try {
    console.log('🔍 Testing API endpoint directly...');
    
    // First, get an admin token
    console.log('📝 Getting admin token...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@notifyx.com',
      password: 'Admin123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Failed to login: ' + loginResponse.data.error.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Now test the job alert endpoint
    console.log('📧 Testing job alert endpoint...');
    const alertResponse = await axios.post(
      'http://localhost:3001/api/v1/jobs/alerts/send/68d912be08f77f9137b4df1f',
      {
        minMatchScore: 40,
        maxUsers: 100,
        dryRun: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ API Response:', JSON.stringify(alertResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API test error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testApiEndpoint();
