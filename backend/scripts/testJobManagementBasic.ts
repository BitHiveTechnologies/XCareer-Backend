import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testBasicEndpoints() {
  console.log('🚀 BASIC JOB MANAGEMENT TESTING');
  console.log('================================\n');

  const tests = [
    {
      name: 'Health Check',
      url: '/health',
      method: 'GET'
    },
    {
      name: 'API Info',
      url: '/api/v1',
      method: 'GET'
    },
    {
      name: 'Public Job Listing',
      url: '/api/v1/jobs',
      method: 'GET'
    },
    {
      name: 'Job Search',
      url: '/api/v1/jobs/search?q=engineer',
      method: 'GET'
    },
    {
      name: 'Job Stats',
      url: '/api/v1/jobs/stats/overview',
      method: 'GET'
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 5000
      });

      if (response.status === 200) {
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Status: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
  }

  console.log('\n📊 BASIC TEST SUMMARY');
  console.log('======================');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (passed === total) {
    console.log('🎉 All basic endpoints are working!');
  } else {
    console.log('⚠️  Some endpoints failed. Server might not be running or endpoints might not exist.');
  }
}

// Run the basic tests
testBasicEndpoints().catch(console.error);
