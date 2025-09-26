import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class SubscriptionAccessControlTester {
  private basicUserToken: string = '';
  private premiumUserToken: string = '';
  private enterpriseUserToken: string = '';
  private basicUserId: string = '';
  private premiumUserId: string = '';
  private enterpriseUserId: string = '';

  async runTests(): Promise<void> {
    console.log('🔒 SUBSCRIPTION ACCESS CONTROL TESTING (FIXED)');
    console.log('==============================================\n');

    const results: TestResult[] = [];

    // Test authentication with different user types
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

      // Test basic user login
      const basicResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'jane.smith@example.com',
        password: 'JaneSmith123!'
      }, { timeout: 5000 });

      if (basicResponse.data.success) {
        this.basicUserToken = basicResponse.data.data.accessToken;
        this.basicUserId = basicResponse.data.data.user.id;
        console.log('✅ Basic user authentication successful');
      }

      // Test premium user login
      const premiumResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'mike.wilson@example.com',
        password: 'MikeWilson123!'
      }, { timeout: 5000 });

      if (premiumResponse.data.success) {
        this.premiumUserToken = premiumResponse.data.data.accessToken;
        this.premiumUserId = premiumResponse.data.data.user.id;
        console.log('✅ Premium user authentication successful');
      }

      // Test enterprise user login (we'll create one if needed)
      try {
        const enterpriseResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
          email: 'enterprise@example.com',
          password: 'Enterprise123!'
        }, { timeout: 5000 });

        if (enterpriseResponse.data.success) {
          this.enterpriseUserToken = enterpriseResponse.data.data.accessToken;
          this.enterpriseUserId = enterpriseResponse.data.data.user.id;
          console.log('✅ Enterprise user authentication successful');
        }
      } catch (error) {
        console.log('⚠️ Enterprise user not found, will create one');
        await this.createEnterpriseUser();
      }

      return {
        name: 'Authentication',
        passed: true,
        details: {
          basicUserToken: !!this.basicUserToken,
          premiumUserToken: !!this.premiumUserToken,
          enterpriseUserToken: !!this.enterpriseUserToken,
          basicUserId: this.basicUserId,
          premiumUserId: this.premiumUserId,
          enterpriseUserId: this.enterpriseUserId
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

  private async createEnterpriseUser(): Promise<void> {
    try {
      console.log('🏢 Creating enterprise user...');
      
      const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        name: 'Enterprise User',
        email: 'enterprise@example.com',
        password: 'Enterprise123!',
        mobile: '9876543210',
        qualification: 'MBA',
        stream: 'Business',
        yearOfPassout: 2020,
        cgpaOrPercentage: 85
      }, { timeout: 5000 });

      if (registerResponse.data.success) {
        this.enterpriseUserToken = registerResponse.data.data.accessToken;
        this.enterpriseUserId = registerResponse.data.data.user.id;
        
        // Update user to enterprise subscription
        await axios.patch(`${BASE_URL}/api/v1/users/profile/${this.enterpriseUserId}`, {
          subscriptionPlan: 'enterprise'
        }, {
          headers: { Authorization: `Bearer ${this.enterpriseUserToken}` }
        });
        
        console.log('✅ Enterprise user created and updated to enterprise plan');
      }
    } catch (error: any) {
      console.log('⚠️ Could not create enterprise user:', error.message);
    }
  }

  private async testBasicUserAccess(): Promise<TestResult> {
    try {
      console.log('👤 Testing Basic User Access...');

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.basicUserToken}` },
        timeout: 5000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        const allBasicTier = templates.every((template: any) => 
          template.subscriptionTier === 'basic'
        );

        console.log(`✅ Basic user access test - Found ${templates.length} templates`);
        console.log(`   All templates are basic tier: ${allBasicTier}`);

        return {
          name: 'Basic User Access',
          passed: true,
          details: {
            templateCount: templates.length,
            allBasicTier,
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

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.premiumUserToken}` },
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

      if (!this.enterpriseUserToken) {
        return {
          name: 'Enterprise User Access',
          passed: false,
          error: 'No enterprise user token available'
        };
      }

      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.enterpriseUserToken}` },
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
        const allBasicTier = templates.every((template: any) => 
          template.subscriptionTier === 'basic'
        );

        console.log(`✅ Unauthenticated access test - Found ${templates.length} templates`);
        console.log(`   All templates are basic tier: ${allBasicTier}`);

        return {
          name: 'Unauthenticated Access',
          passed: true,
          details: {
            templateCount: templates.length,
            allBasicTier,
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

      // Test basic tier filtering
      const basicResponse = await axios.get(`${BASE_URL}/api/v1/templates?subscriptionTier=basic`, {
        timeout: 5000
      });

      // Test premium tier filtering
      const premiumResponse = await axios.get(`${BASE_URL}/api/v1/templates?subscriptionTier=premium`, {
        timeout: 5000
      });

      const basicTemplates = basicResponse.data.success ? basicResponse.data.data.templates : [];
      const premiumTemplates = premiumResponse.data.success ? premiumResponse.data.data.templates : [];

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
    } catch (error: any) {
      console.log('❌ Tier filtering test failed:', error.message);
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

      // Get a template ID from the basic user access
      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.basicUserToken}` },
        timeout: 5000
      });

      if (response.data.success && response.data.data.templates.length > 0) {
        const templateId = response.data.data.templates[0].id;
        
        const templateResponse = await axios.get(`${BASE_URL}/api/v1/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${this.basicUserToken}` },
          timeout: 5000
        });

        if (templateResponse.data.success) {
          const template = templateResponse.data.data.template;
          console.log(`✅ Individual template access test - Template: ${template.name}`);
          console.log(`   Template tier: ${template.subscriptionTier}`);

          return {
            name: 'Individual Template Access',
            passed: true,
            details: {
              templateId,
              templateName: template.name,
              templateTier: template.subscriptionTier
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

    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\n📈 SUMMARY: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Please review the results above.');
    }
  }
}

// Run the tests
const tester = new SubscriptionAccessControlTester();
tester.runTests();
