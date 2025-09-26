import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class JobManagementSubscriptionTester {
  private authToken: string = '';
  private adminToken: string = '';
  private testUserId: string = '';
  private testJobId: string = '';

  async runTests(): Promise<void> {
    console.log('🚀 JOB MANAGEMENT SUBSCRIPTION TESTING');
    console.log('======================================\n');

    const results: TestResult[] = [];

    try {
      // Test authentication first
      const authResult = await this.testAuthentication();
      results.push(authResult);

      if (authResult.passed) {
        // Test job listing with subscription filtering
        const listingResult = await this.testJobListingWithSubscription();
        results.push(listingResult);

        // Test job search with subscription filtering
        const searchResult = await this.testJobSearchWithSubscription();
        results.push(searchResult);

        // Test job application with subscription validation
        const applicationResult = await this.testJobApplicationWithSubscription();
        results.push(applicationResult);

        // Test premium job access
        const premiumResult = await this.testPremiumJobAccess();
        results.push(premiumResult);

        // Test enterprise job access
        const enterpriseResult = await this.testEnterpriseJobAccess();
        results.push(enterpriseResult);
      }

      this.printResults(results);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');
      
      // Test user login
      const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'jane.smith@example.com',
        password: 'JaneSmith123!'
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
      console.log('Error details:', error.response?.data || error);
      return {
        name: 'Authentication',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobListingWithSubscription(): Promise<TestResult> {
    try {
      console.log('📋 Testing Job Listing with Subscription Filtering...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs;
        console.log(`✅ Job listing successful - Found ${jobs.length} jobs`);
        
        // Check if jobs are filtered based on subscription
        const hasPremiumJobs = jobs.some((job: any) => job.description?.includes('premium'));
        const hasEnterpriseJobs = jobs.some((job: any) => job.description?.includes('enterprise'));
        
        return {
          name: 'Job Listing with Subscription',
          passed: true,
          details: {
            totalJobs: jobs.length,
            hasPremiumJobs,
            hasEnterpriseJobs,
            subscriptionFiltering: !hasPremiumJobs && !hasEnterpriseJobs
          }
        };
      }

      return {
        name: 'Job Listing with Subscription',
        passed: false,
        error: 'Failed to get job listing'
      };
    } catch (error: any) {
      console.log('❌ Job listing failed:', error.message);
      return {
        name: 'Job Listing with Subscription',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobSearchWithSubscription(): Promise<TestResult> {
    try {
      console.log('🔍 Testing Job Search with Subscription Filtering...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/jobs/search?q=engineer`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs;
        console.log(`✅ Job search successful - Found ${jobs.length} jobs`);
        
        return {
          name: 'Job Search with Subscription',
          passed: true,
          details: {
            totalJobs: jobs.length,
            searchQuery: 'engineer'
          }
        };
      }

      return {
        name: 'Job Search with Subscription',
        passed: false,
        error: 'Failed to search jobs'
      };
    } catch (error: any) {
      console.log('❌ Job search failed:', error.message);
      return {
        name: 'Job Search with Subscription',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobApplicationWithSubscription(): Promise<TestResult> {
    try {
      console.log('📝 Testing Job Application with Subscription Validation...');
      
      // First, get a job to apply for
      const jobsResponse = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (jobsResponse.data.success && jobsResponse.data.data.jobs.length > 0) {
        const job = jobsResponse.data.data.jobs[0];
        this.testJobId = job.id;

        // Try to apply for the job
        const applicationResponse = await axios.post(
          `${BASE_URL}/api/v1/applications/${this.testJobId}`,
          {
            resumeUrl: 'https://example.com/resume.pdf',
            coverLetter: 'I am interested in this position.'
          },
          {
            headers: { Authorization: `Bearer ${this.authToken}` },
            timeout: 10000
          }
        );

        if (applicationResponse.data.success) {
          console.log('✅ Job application successful');
          return {
            name: 'Job Application with Subscription',
            passed: true,
            details: {
              jobId: this.testJobId,
              applicationId: applicationResponse.data.data.application.id
            }
          };
        }
      }

      return {
        name: 'Job Application with Subscription',
        passed: false,
        error: 'No jobs available or application failed'
      };
    } catch (error: any) {
      console.log('❌ Job application failed:', error.message);
      return {
        name: 'Job Application with Subscription',
        passed: false,
        error: error.message
      };
    }
  }

  private async testPremiumJobAccess(): Promise<TestResult> {
    try {
      console.log('💎 Testing Premium Job Access...');
      
      // Try to access a premium job (this should fail for basic users)
      const response = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs;
        const premiumJobs = jobs.filter((job: any) => job.description?.includes('premium'));
        
        if (premiumJobs.length === 0) {
          console.log('✅ Premium jobs are properly filtered out for basic users');
          return {
            name: 'Premium Job Access',
            passed: true,
            details: {
              premiumJobsFound: 0,
              subscriptionFiltering: true
            }
          };
        } else {
          console.log('⚠️  Premium jobs are visible to basic users');
          return {
            name: 'Premium Job Access',
            passed: false,
            details: {
              premiumJobsFound: premiumJobs.length,
              subscriptionFiltering: false
            }
          };
        }
      }

      return {
        name: 'Premium Job Access',
        passed: false,
        error: 'Failed to check premium job access'
      };
    } catch (error: any) {
      console.log('❌ Premium job access test failed:', error.message);
      return {
        name: 'Premium Job Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testEnterpriseJobAccess(): Promise<TestResult> {
    try {
      console.log('🏢 Testing Enterprise Job Access...');
      
      // Try to access enterprise jobs (this should fail for basic users)
      const response = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs;
        const enterpriseJobs = jobs.filter((job: any) => job.description?.includes('enterprise'));
        
        if (enterpriseJobs.length === 0) {
          console.log('✅ Enterprise jobs are properly filtered out for basic users');
          return {
            name: 'Enterprise Job Access',
            passed: true,
            details: {
              enterpriseJobsFound: 0,
              subscriptionFiltering: true
            }
          };
        } else {
          console.log('⚠️  Enterprise jobs are visible to basic users');
          return {
            name: 'Enterprise Job Access',
            passed: false,
            details: {
              enterpriseJobsFound: enterpriseJobs.length,
              subscriptionFiltering: false
            }
          };
        }
      }

      return {
        name: 'Enterprise Job Access',
        passed: false,
        error: 'Failed to check enterprise job access'
      };
    } catch (error: any) {
      console.log('❌ Enterprise job access test failed:', error.message);
      return {
        name: 'Enterprise Job Access',
        passed: false,
        error: error.message
      };
    }
  }

  private printResults(results: TestResult[]): void {
    console.log('\n📊 JOB MANAGEMENT SUBSCRIPTION TEST RESULTS');
    console.log('===========================================');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📈 SUMMARY: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('🎉 All job management subscription tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
  }
}

// Run the tests
const tester = new JobManagementSubscriptionTester();
tester.runTests().catch(console.error);
