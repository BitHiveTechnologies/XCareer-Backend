import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function debugSubscriptionAccess() {
  console.log('🔍 DEBUGGING SUBSCRIPTION ACCESS CONTROL');
  console.log('========================================\n');

  try {
    // Step 1: Login and get token
    console.log('1. Testing authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@notifyx.com',
      password: 'Admin123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    const userId = loginResponse.data.data.user.id;
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get user profile to check subscription plan
    console.log('\n2. Checking user subscription plan...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        const user = profileResponse.data.data.user;
        console.log('✅ User profile retrieved');
        console.log(`   Subscription Plan: ${user.subscriptionPlan || 'not set'}`);
        console.log(`   Role: ${user.role || 'not set'}`);
      } else {
        console.log('❌ Failed to get user profile:', profileResponse.data);
      }
    } catch (error: any) {
      console.log('❌ Error getting user profile:', error.message);
      if (error.response) {
        console.log('   Response:', error.response.data);
      }
    }

    // Step 3: Test templates endpoint
    console.log('\n3. Testing templates endpoint...');
    try {
      const templatesResponse = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (templatesResponse.data.success) {
        const templates = templatesResponse.data.data.templates;
        console.log('✅ Templates retrieved successfully');
        console.log(`   Found ${templates.length} templates`);
        
        templates.forEach((template: any, index: number) => {
          console.log(`   Template ${index + 1}: ${template.name} (${template.subscriptionTier})`);
        });
      } else {
        console.log('❌ Failed to get templates:', templatesResponse.data);
      }
    } catch (error: any) {
      console.log('❌ Error getting templates:', error.message);
      if (error.response) {
        console.log('   Response:', error.response.data);
      }
    }

    // Step 4: Test unauthenticated access
    console.log('\n4. Testing unauthenticated access...');
    try {
      const unauthenticatedResponse = await axios.get(`${BASE_URL}/api/v1/templates`);
      
      if (unauthenticatedResponse.data.success) {
        const templates = unauthenticatedResponse.data.data.templates;
        console.log('✅ Unauthenticated access successful');
        console.log(`   Found ${templates.length} templates`);
        
        const allBasic = templates.every((template: any) => template.subscriptionTier === 'basic');
        console.log(`   All templates are basic tier: ${allBasic}`);
      } else {
        console.log('❌ Unauthenticated access failed:', unauthenticatedResponse.data);
      }
    } catch (error: any) {
      console.log('❌ Error with unauthenticated access:', error.message);
    }

  } catch (error: any) {
    console.log('❌ Debug failed:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
  }
}

debugSubscriptionAccess();
