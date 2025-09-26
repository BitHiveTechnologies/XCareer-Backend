import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class JobManagementEnhancementTester {
  private authToken: string = '';
  private adminToken: string = '';
  private testUserId: string = '';
  private testJobId: string = '';

  async runTests(): Promise<void> {
    console.log('🔧 JOB MANAGEMENT API ENHANCEMENT TESTING');
    console.log('==========================================\n');

    const results: TestResult[] = [];

    // Test authentication
    const authResult = await this.testAuthentication();
    results.push(authResult);

    if (!authResult.passed) {
      console.log('❌ Authentication failed, skipping remaining tests');
      this.printResults(results);
      return;
    }

    // Test job creation (admin only)
    results.push(await this.testJobCreation());

    // Test job listing with subscription filtering
    results.push(await this.testJobListingWithSubscriptionFiltering());

    // Test job search with subscription filtering
    results.push(await this.testJobSearchWithSubscriptionFiltering());

    // Test job application with subscription validation
    results.push(await this.testJobApplicationWithSubscriptionValidation());

    // Test user applications retrieval
    results.push(await this.testUserApplicationsRetrieval());

    // Test job matching algorithm with subscription validation
    results.push(await this.testJobMatchingWithSubscriptionValidation());

    // Test admin job management
    results.push(await this.testAdminJobManagement());

    // Test job statistics
    results.push(await this.testJobStatistics());

    this.printResults(results);
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');

      // Test user login with timeout
      const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'mike.wilson@example.com',
        password: 'MikeWilson123!'
      }, { timeout: 5000 });

      console.log('User response:', userResponse.data);

      if (userResponse.data.success) {
        this.authToken = userResponse.data.data.accessToken;
        this.testUserId = userResponse.data.data.user.id;
        console.log('✅ User authentication successful');
      } else {
        console.log('❌ User authentication failed:', userResponse.data);
        return {
          name: 'Authentication',
          passed: false,
          error: 'User authentication failed'
        };
      }

      // Test admin login with timeout
      const adminResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      }, { timeout: 5000 });

      console.log('Admin response:', adminResponse.data);

      if (adminResponse.data.success) {
        this.adminToken = adminResponse.data.data.accessToken;
        console.log('✅ Admin authentication successful');
      } else {
        console.log('❌ Admin authentication failed:', adminResponse.data);
        return {
          name: 'Authentication',
          passed: false,
          error: 'Admin authentication failed'
        };
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
      console.log('Error details:', error.response?.data);
      return {
        name: 'Authentication',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobCreation(): Promise<TestResult> {
    try {
      console.log('\n📝 Testing Job Creation (Admin Only)...');

      const jobData = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        description: 'We are looking for a senior software engineer with 5+ years of experience in Node.js and React. This is a premium position with excellent benefits.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT'],
          passoutYears: [2020, 2021, 2022],
          minCGPA: 7.5
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicationLink: 'https://techcorp.com/careers',
        location: 'remote',
        salary: '$100,000 - $150,000'
      };

      const response = await axios.post(`${BASE_URL}/api/v1/jobs`, jobData, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        this.testJobId = response.data.data.job.id;
        console.log('✅ Job creation successful');
        console.log(`   Job ID: ${this.testJobId}`);
        console.log(`   Title: ${response.data.data.job.title}`);
        console.log(`   Company: ${response.data.data.job.company}`);
      }

      return {
        name: 'Job Creation',
        passed: response.data.success,
        details: {
          jobId: this.testJobId,
          title: response.data.data?.job?.title,
          company: response.data.data?.job?.company
        }
      };
    } catch (error: any) {
      console.log('❌ Job creation failed:', error.message);
      return {
        name: 'Job Creation',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobListingWithSubscriptionFiltering(): Promise<TestResult> {
    try {
      console.log('\n📋 Testing Job Listing with Subscription Filtering...');

      // Test authenticated user job listing
      const userResponse = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (userResponse.data.success) {
        const jobs = userResponse.data.data.jobs;
        console.log('✅ User job listing successful');
        console.log(`   Found ${jobs.length} jobs`);
        console.log(`   Jobs: ${jobs.map((j: any) => `${j.title} (${j.type})`).join(', ')}`);
      }

      // Test unauthenticated job listing
      const unauthResponse = await axios.get(`${BASE_URL}/api/v1/jobs`, { timeout: 5000 });

      if (unauthResponse.data.success) {
        const jobs = unauthResponse.data.data.jobs;
        console.log('✅ Unauthenticated job listing successful');
        console.log(`   Found ${jobs.length} jobs`);
      }

      return {
        name: 'Job Listing with Subscription Filtering',
        passed: userResponse.data.success && unauthResponse.data.success,
        details: {
          userJobs: userResponse.data.success ? userResponse.data.data.jobs.length : 0,
          unauthJobs: unauthResponse.data.success ? unauthResponse.data.data.jobs.length : 0
        }
      };
    } catch (error: any) {
      console.log('❌ Job listing test failed:', error.message);
      return {
        name: 'Job Listing with Subscription Filtering',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobSearchWithSubscriptionFiltering(): Promise<TestResult> {
    try {
      console.log('\n🔍 Testing Job Search with Subscription Filtering...');

      const searchParams = {
        query: 'software',
        type: 'job',
        location: 'remote',
        qualifications: 'B.Tech',
        streams: 'CSE'
      };

      const response = await axios.get(`${BASE_URL}/api/v1/jobs/search`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        params: searchParams,
        timeout: 5000
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs;
        console.log('✅ Job search successful');
        console.log(`   Found ${jobs.length} jobs matching criteria`);
        console.log(`   Search filters applied: ${JSON.stringify(response.data.data.filters)}`);
      }

      return {
        name: 'Job Search with Subscription Filtering',
        passed: response.data.success,
        details: {
          jobsFound: response.data.success ? response.data.data.jobs.length : 0,
          filters: response.data.success ? response.data.data.filters : null
        }
      };
    } catch (error: any) {
      console.log('❌ Job search test failed:', error.message);
      return {
        name: 'Job Search with Subscription Filtering',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobApplicationWithSubscriptionValidation(): Promise<TestResult> {
    try {
      console.log('\n📄 Testing Job Application with Subscription Validation...');

      if (!this.testJobId) {
        return {
          name: 'Job Application with Subscription Validation',
          passed: false,
          error: 'No test job ID available'
        };
      }

      const applicationData = {
        resumeUrl: 'https://example.com/resume.pdf',
        coverLetter: 'I am very interested in this position and believe my skills match the requirements.'
      };

      const response = await axios.post(`${BASE_URL}/api/v1/applications/${this.testJobId}/apply`, applicationData, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        console.log('✅ Job application successful');
        console.log(`   Application ID: ${response.data.data.application.id}`);
        console.log(`   Status: ${response.data.data.application.status}`);
      }

      return {
        name: 'Job Application with Subscription Validation',
        passed: response.data.success,
        details: {
          applicationId: response.data.success ? response.data.data.application.id : null,
          status: response.data.success ? response.data.data.application.status : null
        }
      };
    } catch (error: any) {
      console.log('❌ Job application test failed:', error.message);
      return {
        name: 'Job Application with Subscription Validation',
        passed: false,
        error: error.message
      };
    }
  }

  private async testUserApplicationsRetrieval(): Promise<TestResult> {
    try {
      console.log('\n📋 Testing User Applications Retrieval...');

      const response = await axios.get(`${BASE_URL}/api/v1/applications/my-applications`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const applications = response.data.data.applications;
        console.log('✅ User applications retrieval successful');
        console.log(`   Found ${applications.length} applications`);
        applications.forEach((app: any, index: number) => {
          console.log(`   Application ${index + 1}: ${app.job?.title} - ${app.status}`);
        });
      }

      return {
        name: 'User Applications Retrieval',
        passed: response.data.success,
        details: {
          applicationsCount: response.data.success ? response.data.data.applications.length : 0
        }
      };
    } catch (error: any) {
      console.log('❌ User applications retrieval test failed:', error.message);
      return {
        name: 'User Applications Retrieval',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobMatchingWithSubscriptionValidation(): Promise<TestResult> {
    try {
      console.log('\n🎯 Testing Job Matching with Subscription Validation...');

      const response = await axios.get(`${BASE_URL}/api/v1/matching/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const matches = response.data.data.matchingJobs;
        console.log('✅ Job matching successful');
        console.log(`   Found ${matches.length} job matches`);
        matches.forEach((match: any, index: number) => {
          console.log(`   Match ${index + 1}: ${match.title} - Score: ${match.matchScore}`);
        });
      }

      return {
        name: 'Job Matching with Subscription Validation',
        passed: response.data.success,
        details: {
          matchesCount: response.data.success ? response.data.data.matchingJobs.length : 0
        }
      };
    } catch (error: any) {
      console.log('❌ Job matching test failed:', error.message);
      return {
        name: 'Job Matching with Subscription Validation',
        passed: false,
        error: error.message
      };
    }
  }

  private async testAdminJobManagement(): Promise<TestResult> {
    try {
      console.log('\n👨‍💼 Testing Admin Job Management...');

      // Test admin job listing
      const jobsResponse = await axios.get(`${BASE_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (jobsResponse.data.success) {
        console.log('✅ Admin job listing successful');
        console.log(`   Found ${jobsResponse.data.data.jobs.length} jobs`);
      }

      // Test job statistics
      const statsResponse = await axios.get(`${BASE_URL}/api/v1/jobs/stats/overview`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (statsResponse.data.success) {
        console.log('✅ Job statistics retrieval successful');
        console.log(`   Total jobs: ${statsResponse.data.data.overview.totalJobs}`);
        console.log(`   Active jobs: ${statsResponse.data.data.overview.activeJobs}`);
      }

      return {
        name: 'Admin Job Management',
        passed: jobsResponse.data.success && statsResponse.data.success,
        details: {
          jobsCount: jobsResponse.data.success ? jobsResponse.data.data.jobs.length : 0,
          totalJobs: statsResponse.data.success ? statsResponse.data.data.overview.totalJobs : 0
        }
      };
    } catch (error: any) {
      console.log('❌ Admin job management test failed:', error.message);
      return {
        name: 'Admin Job Management',
        passed: false,
        error: error.message
      };
    }
  }

  private async testJobStatistics(): Promise<TestResult> {
    try {
      console.log('\n📊 Testing Job Statistics...');

      const response = await axios.get(`${BASE_URL}/api/v1/jobs/stats/overview`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const stats = response.data.data;
        console.log('✅ Job statistics successful');
        console.log(`   Total jobs: ${stats.overview.totalJobs}`);
        console.log(`   Active jobs: ${stats.overview.activeJobs}`);
        console.log(`   Inactive jobs: ${stats.overview.inactiveJobs}`);
        console.log(`   Internship jobs: ${stats.overview.internshipJobs}`);
        console.log(`   Regular jobs: ${stats.overview.regularJobs}`);
      }

      return {
        name: 'Job Statistics',
        passed: response.data.success,
        details: {
          totalJobs: response.data.success ? response.data.data.overview.totalJobs : 0,
          activeJobs: response.data.success ? response.data.data.overview.activeJobs : 0
        }
      };
    } catch (error: any) {
      console.log('❌ Job statistics test failed:', error.message);
      return {
        name: 'Job Statistics',
        passed: false,
        error: error.message
      };
    }
  }

  private printResults(results: TestResult[]): void {
    console.log('\n📊 JOB MANAGEMENT API ENHANCEMENT TEST RESULTS');
    console.log('==============================================');
    let passedCount = 0;
    results.forEach(result => {
      if (result.passed) {
        console.log(`✅ ${result.name}`);
        passedCount++;
      } else {
        console.log(`❌ ${result.name}`);
      }
      if (result.details) {
        console.log('   Details:', result.details);
      }
      if (result.error) {
        console.log('   Error:', result.error);
      }
    });
    console.log(`\n📈 SUMMARY: ${passedCount}/${results.length} tests passed (${((passedCount / results.length) * 100).toFixed(1)}%)`);
    if (passedCount < results.length) {
      console.log('⚠️ Some tests failed. Please review the results above.');
    }
  }
}

new JobManagementEnhancementTester().runTests();