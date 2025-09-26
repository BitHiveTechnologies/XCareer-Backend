import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class JobManagementTester {
  private authToken: string = '';
  private adminToken: string = '';
  private testUserId: string = '';

  async runTests(): Promise<void> {
    console.log('🚀 JOB MANAGEMENT API ENHANCEMENT TESTING (SIMPLE)');
    console.log('==================================================\n');

    try {
      // Run all tests
      const results: TestResult[] = [];

      results.push(await this.testAuthentication());
      results.push(await this.testJobListing());
      results.push(await this.testJobSearch());
      results.push(await this.testJobCreation());
      results.push(await this.testJobApplication());
      results.push(await this.testJobMatching());

      // Display results
      this.displayResults(results);
    } catch (error) {
      console.error('❌ Test setup failed:', error);
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');

      // Test user login
      const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'john.doe@example.com',
        password: 'JohnDoe123!'
      }, { timeout: 5000 });

      if (userResponse.data.success) {
        this.authToken = userResponse.data.data.accessToken;
        this.testUserId = userResponse.data.data.user.id;
        console.log('✅ User authentication successful');
      }

      // Test admin login
      const adminResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      }, { timeout: 5000 });

      if (adminResponse.data.success) {
        this.adminToken = adminResponse.data.data.accessToken;
        console.log('✅ Admin authentication successful');
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
      console.log('❌ Authentication failed:', error.message);
      return {
        name: 'Authentication',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobListing(): Promise<TestResult> {
    try {
      console.log('📋 Testing Job Listing...');

      const response = await axios.get(`${BASE_URL}/api/v1/jobs`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Job listing successful');
        return {
          name: 'Job Listing',
          passed: true,
          details: {
            status: response.status,
            jobCount: response.data.data?.length || 0
          }
        };
      } else {
        return {
          name: 'Job Listing',
          passed: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.log('❌ Job listing failed:', error.message);
      return {
        name: 'Job Listing',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobSearch(): Promise<TestResult> {
    try {
      console.log('🔍 Testing Job Search...');

      const response = await axios.get(`${BASE_URL}/api/v1/jobs/search?q=engineer`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Job search successful');
        return {
          name: 'Job Search',
          passed: true,
          details: {
            status: response.status,
            resultCount: response.data.data?.length || 0
          }
        };
      } else {
        return {
          name: 'Job Search',
          passed: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.log('❌ Job search failed:', error.message);
      return {
        name: 'Job Search',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobCreation(): Promise<TestResult> {
    try {
      console.log('➕ Testing Job Creation...');

      if (!this.adminToken) {
        return {
          name: 'Job Creation',
          passed: false,
          error: 'No admin token available'
        };
      }

      const jobData = {
        title: 'Test Software Engineer',
        company: 'Test Company',
        location: 'Remote',
        type: 'job',
        description: 'Test job description',
        requirements: ['JavaScript', 'Node.js'],
        salary: { min: 50000, max: 80000, currency: 'USD' },
        benefits: ['Health insurance', 'Remote work'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await axios.post(`${BASE_URL}/api/v1/jobs`, jobData, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });
      
      if (response.status === 201) {
        console.log('✅ Job creation successful');
        return {
          name: 'Job Creation',
          passed: true,
          details: {
            status: response.status,
            jobId: response.data.data?.id
          }
        };
      } else {
        return {
          name: 'Job Creation',
          passed: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.log('❌ Job creation failed:', error.message);
      return {
        name: 'Job Creation',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobApplication(): Promise<TestResult> {
    try {
      console.log('📝 Testing Job Application...');

      if (!this.authToken) {
        return {
          name: 'Job Application',
          passed: false,
          error: 'No user token available'
        };
      }

      // First get a job ID
      const jobsResponse = await axios.get(`${BASE_URL}/api/v1/jobs`, { timeout: 5000 });
      const jobs = jobsResponse.data.data || [];
      
      if (jobs.length === 0) {
        return {
          name: 'Job Application',
          passed: false,
          error: 'No jobs available to apply to'
        };
      }

      const jobId = jobs[0]._id;
      const applicationData = {
        coverLetter: 'Test cover letter',
        resume: 'Test resume content'
      };

      const response = await axios.post(`${BASE_URL}/api/v1/applications/${jobId}/apply`, applicationData, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });
      
      if (response.status === 201) {
        console.log('✅ Job application successful');
        return {
          name: 'Job Application',
          passed: true,
          details: {
            status: response.status,
            applicationId: response.data.data?.id
          }
        };
      } else {
        return {
          name: 'Job Application',
          passed: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.log('❌ Job application failed:', error.message);
      return {
        name: 'Job Application',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobMatching(): Promise<TestResult> {
    try {
      console.log('🎯 Testing Job Matching...');

      if (!this.authToken) {
        return {
          name: 'Job Matching',
          passed: false,
          error: 'No user token available'
        };
      }

      const response = await axios.get(`${BASE_URL}/api/v1/matching/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('✅ Job matching successful');
        return {
          name: 'Job Matching',
          passed: true,
          details: {
            status: response.status,
            matchCount: response.data.data?.length || 0
          }
        };
      } else {
        return {
          name: 'Job Matching',
          passed: false,
          error: `Unexpected status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.log('❌ Job matching failed:', error.message);
      return {
        name: 'Job Matching',
        passed: false,
        error: error.message
      };
    }
  }

  private displayResults(results: TestResult[]): void {
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details)}`);
      }
    });

    console.log(`\n📈 SUMMARY: ${passed}/${total} tests passed (${successRate}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
  }
}

// Run the tests
const tester = new JobManagementTester();
tester.runTests().catch(console.error);
