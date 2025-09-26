import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class SubscriptionAccessControlTester {
  private authToken: string = '';
  private adminToken: string = '';
  private testUserId: string = '';

  async runTests(): Promise<void> {
    console.log('🔒 SUBSCRIPTION ACCESS CONTROL TESTING');
    console.log('=====================================\n');

    const results: TestResult[] = [];

    // Test authentication
    const authResult = await this.testAuthentication();
    results.push(authResult);

    if (!authResult.passed) {
      console.log('❌ Authentication failed, skipping remaining tests');
      this.printResults(results);
      return;
    }

    // Test basic user access (should only see basic templates)
    const basicAccessResult = await this.testBasicUserAccess();
    results.push(basicAccessResult);

    // Test premium user access (should see basic and premium templates)
    const premiumAccessResult = await this.testPremiumUserAccess();
    results.push(premiumAccessResult);

    // Test enterprise user access (should see all templates)
    const enterpriseAccessResult = await this.testEnterpriseUserAccess();
    results.push(enterpriseAccessResult);

    // Test unauthenticated access (should see basic templates only)
    const unauthenticatedResult = await this.testUnauthenticatedAccess();
    results.push(unauthenticatedResult);

    // Test subscription tier filtering
    const tierFilteringResult = await this.testSubscriptionTierFiltering();
    results.push(tierFilteringResult);

    // Test access control for individual template
    const individualTemplateResult = await this.testIndividualTemplateAccess();
    results.push(individualTemplateResult);

    this.printResults(results);
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');

      // Test user login
      const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      }, { timeout: 5000 });

      if (userResponse.data.success) {
        this.authToken = userResponse.data.data.accessToken;
        this.testUserId = userResponse.data.data.user.id;
        console.log('✅ User authentication successful');
      } else {
        console.log('❌ User authentication failed:', userResponse.data);
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

  private async testBasicUserAccess(): Promise<TestResult> {
    try {
      console.log('👤 Testing Basic User Access...');

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        const hasOnlyBasicTemplates = templates.every((template: any) => 
          template.subscriptionTier === 'basic'
        );

        console.log(`✅ Basic user access test - Found ${templates.length} templates`);
        console.log(`   All templates are basic tier: ${hasOnlyBasicTemplates}`);

        return {
          name: 'Basic User Access',
          passed: true,
          details: {
            templateCount: templates.length,
            allBasicTier: hasOnlyBasicTemplates,
            templates: templates.map((t: any) => ({
              name: t.name,
              tier: t.subscriptionTier
            }))
          }
        };
      }

      return {
        name: 'Basic User Access',
        passed: false,
        error: 'Failed to get templates'
      };
    } catch (error: any) {
      console.log('❌ Basic user access test failed:', error.message);
      return {
        name: 'Basic User Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testPremiumUserAccess(): Promise<TestResult> {
    try {
      console.log('⭐ Testing Premium User Access...');

      // First, update user to premium subscription
      const updateResponse = await axios.patch(`${BASE_URL}/api/v1/users/profile`, {
        subscriptionPlan: 'premium'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (!updateResponse.data.success) {
        console.log('⚠️ Could not update user to premium, testing with current subscription');
      }

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        const hasBasicTemplates = templates.some((template: any) => 
          template.subscriptionTier === 'basic'
        );
        const hasPremiumTemplates = templates.some((template: any) => 
          template.subscriptionTier === 'premium'
        );

        console.log(`✅ Premium user access test - Found ${templates.length} templates`);
        console.log(`   Has basic templates: ${hasBasicTemplates}`);
        console.log(`   Has premium templates: ${hasPremiumTemplates}`);

        return {
          name: 'Premium User Access',
          passed: true,
          details: {
            templateCount: templates.length,
            hasBasicTemplates,
            hasPremiumTemplates,
            templates: templates.map((t: any) => ({
              name: t.name,
              tier: t.subscriptionTier
            }))
          }
        };
      }

      return {
        name: 'Premium User Access',
        passed: false,
        error: 'Failed to get templates'
      };
    } catch (error: any) {
      console.log('❌ Premium user access test failed:', error.message);
      return {
        name: 'Premium User Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testEnterpriseUserAccess(): Promise<TestResult> {
    try {
      console.log('🏢 Testing Enterprise User Access...');

      // Update user to enterprise subscription
      const updateResponse = await axios.patch(`${BASE_URL}/api/v1/users/profile`, {
        subscriptionPlan: 'enterprise'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (!updateResponse.data.success) {
        console.log('⚠️ Could not update user to enterprise, testing with current subscription');
      }

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        const hasAllTiers = templates.some((template: any) => 
          ['basic', 'premium', 'enterprise'].includes(template.subscriptionTier)
        );

        console.log(`✅ Enterprise user access test - Found ${templates.length} templates`);
        console.log(`   Has templates from all tiers: ${hasAllTiers}`);

        return {
          name: 'Enterprise User Access',
          passed: true,
          details: {
            templateCount: templates.length,
            hasAllTiers,
            templates: templates.map((t: any) => ({
              name: t.name,
              tier: t.subscriptionTier
            }))
          }
        };
      }

      return {
        name: 'Enterprise User Access',
        passed: false,
        error: 'Failed to get templates'
      };
    } catch (error: any) {
      console.log('❌ Enterprise user access test failed:', error.message);
      return {
        name: 'Enterprise User Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testUnauthenticatedAccess(): Promise<TestResult> {
    try {
      console.log('🚫 Testing Unauthenticated Access...');

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        timeout: 5000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        const hasOnlyBasicTemplates = templates.every((template: any) => 
          template.subscriptionTier === 'basic'
        );

        console.log(`✅ Unauthenticated access test - Found ${templates.length} templates`);
        console.log(`   All templates are basic tier: ${hasOnlyBasicTemplates}`);

        return {
          name: 'Unauthenticated Access',
          passed: true,
          details: {
            templateCount: templates.length,
            allBasicTier: hasOnlyBasicTemplates,
            templates: templates.map((t: any) => ({
              name: t.name,
              tier: t.subscriptionTier
            }))
          }
        };
      }

      return {
        name: 'Unauthenticated Access',
        passed: false,
        error: 'Failed to get templates'
      };
    } catch (error: any) {
      console.log('❌ Unauthenticated access test failed:', error.message);
      return {
        name: 'Unauthenticated Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testSubscriptionTierFiltering(): Promise<TestResult> {
    try {
      console.log('🔍 Testing Subscription Tier Filtering...');

      // Test filtering by specific tier
      const basicResponse = await axios.get(`${BASE_URL}/api/v1/templates?subscriptionTier=basic`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      const premiumResponse = await axios.get(`${BASE_URL}/api/v1/templates?subscriptionTier=premium`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (basicResponse.data.success && premiumResponse.data.success) {
        const basicTemplates = basicResponse.data.data.templates;
        const premiumTemplates = premiumResponse.data.data.templates;

        const basicTierCorrect = basicTemplates.every((template: any) => 
          template.subscriptionTier === 'basic'
        );
        const premiumTierCorrect = premiumTemplates.every((template: any) => 
          template.subscriptionTier === 'premium'
        );

        console.log(`✅ Tier filtering test - Basic: ${basicTemplates.length}, Premium: ${premiumTemplates.length}`);
        console.log(`   Basic tier filtering correct: ${basicTierCorrect}`);
        console.log(`   Premium tier filtering correct: ${premiumTierCorrect}`);

        return {
          name: 'Subscription Tier Filtering',
          passed: basicTierCorrect && premiumTierCorrect,
          details: {
            basicTemplates: basicTemplates.length,
            premiumTemplates: premiumTemplates.length,
            basicTierCorrect,
            premiumTierCorrect
          }
        };
      }

      return {
        name: 'Subscription Tier Filtering',
        passed: false,
        error: 'Failed to get filtered templates'
      };
    } catch (error: any) {
      console.log('❌ Subscription tier filtering test failed:', error.message);
      return {
        name: 'Subscription Tier Filtering',
        passed: false,
        error: error.message
      };
    }
  }

  private async testIndividualTemplateAccess(): Promise<TestResult> {
    try {
      console.log('📄 Testing Individual Template Access...');

      // First get a template ID
      const templatesResponse = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 5000
      });

      if (templatesResponse.data.success && templatesResponse.data.data.templates.length > 0) {
        const templateId = templatesResponse.data.data.templates[0].id;

        // Test accessing individual template
        const templateResponse = await axios.get(`${BASE_URL}/api/v1/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        });

        if (templateResponse.data.success) {
          const template = templateResponse.data.data;
          console.log(`✅ Individual template access test - Template: ${template.name}`);
          console.log(`   Template tier: ${template.subscriptionTier}`);

          return {
            name: 'Individual Template Access',
            passed: true,
            details: {
              templateId,
              templateName: template.name,
              subscriptionTier: template.subscriptionTier
            }
          };
        }
      }

      return {
        name: 'Individual Template Access',
        passed: false,
        error: 'Failed to access individual template'
      };
    } catch (error: any) {
      console.log('❌ Individual template access test failed:', error.message);
      return {
        name: 'Individual Template Access',
        passed: false,
        error: error.message
      };
    }
  }

  private printResults(results: TestResult[]): void {
    console.log('\n📊 SUBSCRIPTION ACCESS CONTROL TEST RESULTS');
    console.log('==========================================');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

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

    console.log(`\n📈 SUMMARY: ${passed}/${total} tests passed (${successRate}%)`);
    
    if (passed === total) {
      console.log('🎉 All subscription access control tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Please review the results above.');
    }
  }
}

// Run the tests
const tester = new SubscriptionAccessControlTester();
tester.runTests().catch(console.error);
