import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class ResumeTemplateTester {
  private authToken: string = '';
  private testTemplateId: string = '';

  async runTests(): Promise<void> {
    console.log('🚀 RESUME TEMPLATE API TESTING');
    console.log('==============================\n');

    const results: TestResult[] = [];

    try {
      // Test authentication first
      const authResult = await this.testAuthentication();
      results.push(authResult);

      if (authResult.passed) {
        // Test public endpoints
        const popularResult = await this.testPopularTemplates();
        results.push(popularResult);

        const allTemplatesResult = await this.testGetAllTemplates();
        results.push(allTemplatesResult);

        // Test template filtering
        const categoryResult = await this.testTemplatesByCategory();
        results.push(categoryResult);

        const industryResult = await this.testTemplatesByIndustry();
        results.push(industryResult);

        const experienceResult = await this.testTemplatesByExperienceLevel();
        results.push(experienceResult);

        // Test template access with subscription
        const templateAccessResult = await this.testTemplateAccess();
        results.push(templateAccessResult);

        // Test template download
        const downloadResult = await this.testTemplateDownload();
        results.push(downloadResult);

        // Test template rating
        const ratingResult = await this.testTemplateRating();
        results.push(ratingResult);
      }

      this.printResults(results);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      console.log('🔐 Testing Authentication...');
      
      const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'jane.smith@example.com',
        password: 'JaneSmith123!'
      }, { timeout: 5000 });

      if (response.data.success) {
        this.authToken = response.data.data.accessToken;
        console.log('✅ User authentication successful');
        return {
          name: 'Authentication',
          passed: true,
          details: {
            userToken: !!this.authToken,
            userId: response.data.data.user.id
          }
        };
      }

      return {
        name: 'Authentication',
        passed: false,
        error: 'Failed to authenticate'
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

  private async testPopularTemplates(): Promise<TestResult> {
    try {
      console.log('⭐ Testing Popular Templates...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/templates/popular`, {
        timeout: 10000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        console.log(`✅ Popular templates retrieved - Found ${templates.length} templates`);
        
        return {
          name: 'Popular Templates',
          passed: true,
          details: {
            templateCount: templates.length,
            hasTemplates: templates.length > 0
          }
        };
      }

      return {
        name: 'Popular Templates',
        passed: false,
        error: 'Failed to get popular templates'
      };
    } catch (error: any) {
      console.log('❌ Popular templates test failed:', error.message);
      return {
        name: 'Popular Templates',
        passed: false,
        error: error.message
      };
    }
  }

  private async testGetAllTemplates(): Promise<TestResult> {
    try {
      console.log('📋 Testing Get All Templates...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        console.log(`✅ All templates retrieved - Found ${templates.length} templates`);
        
        if (templates.length > 0) {
          this.testTemplateId = templates[0].id;
        }
        
        return {
          name: 'Get All Templates',
          passed: true,
          details: {
            templateCount: templates.length,
            hasTemplates: templates.length > 0,
            firstTemplateId: this.testTemplateId
          }
        };
      }

      return {
        name: 'Get All Templates',
        passed: false,
        error: 'Failed to get all templates'
      };
    } catch (error: any) {
      console.log('❌ Get all templates test failed:', error.message);
      return {
        name: 'Get All Templates',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplatesByCategory(): Promise<TestResult> {
    try {
      console.log('📂 Testing Templates by Category...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/templates/category/professional`, {
        timeout: 10000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        console.log(`✅ Professional templates retrieved - Found ${templates.length} templates`);
        
        return {
          name: 'Templates by Category',
          passed: true,
          details: {
            templateCount: templates.length,
            category: 'professional'
          }
        };
      }

      return {
        name: 'Templates by Category',
        passed: false,
        error: 'Failed to get templates by category'
      };
    } catch (error: any) {
      console.log('❌ Templates by category test failed:', error.message);
      return {
        name: 'Templates by Category',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplatesByIndustry(): Promise<TestResult> {
    try {
      console.log('🏭 Testing Templates by Industry...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/templates/industry/technology`, {
        timeout: 10000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        console.log(`✅ Technology industry templates retrieved - Found ${templates.length} templates`);
        
        return {
          name: 'Templates by Industry',
          passed: true,
          details: {
            templateCount: templates.length,
            industry: 'technology'
          }
        };
      }

      return {
        name: 'Templates by Industry',
        passed: false,
        error: 'Failed to get templates by industry'
      };
    } catch (error: any) {
      console.log('❌ Templates by industry test failed:', error.message);
      return {
        name: 'Templates by Industry',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplatesByExperienceLevel(): Promise<TestResult> {
    try {
      console.log('👔 Testing Templates by Experience Level...');
      
      const response = await axios.get(`${BASE_URL}/api/v1/templates/experience/entry`, {
        timeout: 10000
      });

      if (response.data.success) {
        const templates = response.data.data.templates;
        console.log(`✅ Entry level templates retrieved - Found ${templates.length} templates`);
        
        return {
          name: 'Templates by Experience Level',
          passed: true,
          details: {
            templateCount: templates.length,
            experienceLevel: 'entry'
          }
        };
      }

      return {
        name: 'Templates by Experience Level',
        passed: false,
        error: 'Failed to get templates by experience level'
      };
    } catch (error: any) {
      console.log('❌ Templates by experience level test failed:', error.message);
      return {
        name: 'Templates by Experience Level',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplateAccess(): Promise<TestResult> {
    try {
      console.log('🔒 Testing Template Access with Subscription...');
      
      if (!this.testTemplateId) {
        return {
          name: 'Template Access',
          passed: false,
          error: 'No template ID available for testing'
        };
      }

      const response = await axios.get(`${BASE_URL}/api/v1/templates/${this.testTemplateId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        const template = response.data.data.template;
        console.log(`✅ Template access successful - ${template.name}`);
        
        return {
          name: 'Template Access',
          passed: true,
          details: {
            templateId: this.testTemplateId,
            templateName: template.name,
            subscriptionTier: template.subscriptionTier
          }
        };
      }

      return {
        name: 'Template Access',
        passed: false,
        error: 'Failed to access template'
      };
    } catch (error: any) {
      console.log('❌ Template access test failed:', error.message);
      return {
        name: 'Template Access',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplateDownload(): Promise<TestResult> {
    try {
      console.log('📥 Testing Template Download...');
      
      if (!this.testTemplateId) {
        return {
          name: 'Template Download',
          passed: false,
          error: 'No template ID available for testing'
        };
      }

      const response = await axios.post(`${BASE_URL}/api/v1/templates/${this.testTemplateId}/download`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        console.log('✅ Template download successful');
        
        return {
          name: 'Template Download',
          passed: true,
          details: {
            templateId: this.testTemplateId,
            downloadCount: response.data.data.downloadCount
          }
        };
      }

      return {
        name: 'Template Download',
        passed: false,
        error: 'Failed to download template'
      };
    } catch (error: any) {
      console.log('❌ Template download test failed:', error.message);
      return {
        name: 'Template Download',
        passed: false,
        error: error.message
      };
    }
  }

  private async testTemplateRating(): Promise<TestResult> {
    try {
      console.log('⭐ Testing Template Rating...');
      
      if (!this.testTemplateId) {
        return {
          name: 'Template Rating',
          passed: false,
          error: 'No template ID available for testing'
        };
      }

      const response = await axios.post(`${BASE_URL}/api/v1/templates/${this.testTemplateId}/rate`, {
        rating: 5
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.data.success) {
        console.log('✅ Template rating successful');
        
        return {
          name: 'Template Rating',
          passed: true,
          details: {
            templateId: this.testTemplateId,
            rating: response.data.data.rating
          }
        };
      }

      return {
        name: 'Template Rating',
        passed: false,
        error: 'Failed to rate template'
      };
    } catch (error: any) {
      console.log('❌ Template rating test failed:', error.message);
      return {
        name: 'Template Rating',
        passed: false,
        error: error.message
      };
    }
  }

  private printResults(results: TestResult[]): void {
    console.log('\n📊 RESUME TEMPLATE TEST RESULTS');
    console.log('================================');
    
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
      console.log('🎉 All resume template tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
  }
}

// Run the tests
const tester = new ResumeTemplateTester();
tester.runTests().catch(console.error);
