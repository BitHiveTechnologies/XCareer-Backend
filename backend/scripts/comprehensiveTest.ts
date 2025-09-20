#!/usr/bin/env ts-node

/**
 * Comprehensive Endpoint Testing with Token Management
 * 
 * This script provides a complete solution for testing all endpoints
 * mentioned in the testing guide, with intelligent token management.
 */

import axios from 'axios';
import { TokenCache } from './tokenCache';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  path: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  responseTime?: number;
}

class ComprehensiveTester {
  private cache = new TokenCache();
  private results: TestResult[] = [];

  async start(): Promise<void> {
    console.log('🎯 COMPREHENSIVE ENDPOINT TESTING');
    console.log('==================================');
    console.log('Testing all endpoints from the testing guide...');
    console.log('');

    // Check for valid token
    let token = this.cache.getValidToken();
    if (!token) {
      console.log('❌ No valid cached token found.');
      console.log('Please get a fresh token from: http://localhost:8080/src/jwt.html');
      console.log('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const newToken = await new Promise<string>((resolve) => {
        rl.question('🔑 Paste your fresh Clerk token: ', (answer: string) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (newToken) {
        this.cache.addToken(newToken);
        token = newToken;
      } else {
        console.log('❌ No token provided. Testing only public endpoints.');
        await this.testPublicEndpoints();
        this.showResults();
        return;
      }
    }

    // Test all endpoint categories
    await this.testPublicEndpoints();
    await this.testAuthenticationEndpoints(token);
    await this.testSubscriptionEndpoints(token);
    await this.testJobManagementEndpoints(token);
    await this.testNotificationEndpoints(token);
    await this.testAdminEndpoints(token);

    this.showResults();
  }

  private async testPublicEndpoints(): Promise<void> {
    console.log('\n🌐 PHASE 1: PUBLIC ENDPOINTS');
    console.log('=============================');

    const endpoints = [
      { path: '/health', method: 'GET', name: 'Health Check' },
      { path: '/api/v1', method: 'GET', name: 'API Documentation' },
      { path: '/api/v1/jobs?limit=10', method: 'GET', name: 'Get Jobs' },
      { path: '/api/v1/jobs/search?q=engineer', method: 'GET', name: 'Search Jobs' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Public',
        ...endpoint
      });
      await this.delay(100);
    }
  }

  private async testAuthenticationEndpoints(token: string): Promise<void> {
    console.log('\n🔐 PHASE 2: AUTHENTICATION & USER MANAGEMENT');
    console.log('=============================================');

    const endpoints = [
      { path: '/api/v1/clerk-auth/me', method: 'GET', name: 'Get Current User' },
      { path: '/api/v1/users/profile', method: 'GET', name: 'Get User Profile' },
      { path: '/api/v1/users/profile/completion', method: 'GET', name: 'Profile Completion Status' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Authentication',
        ...endpoint
      }, token);
      await this.delay(100);
    }
  }

  private async testSubscriptionEndpoints(token: string): Promise<void> {
    console.log('\n💳 PHASE 3: SUBSCRIPTION & PAYMENT MANAGEMENT');
    console.log('==============================================');

    const endpoints = [
      { path: '/api/v1/subscriptions/plans', method: 'GET', name: 'Get Subscription Plans' },
      { path: '/api/v1/subscriptions/status', method: 'GET', name: 'Get Subscription Status' },
      { path: '/api/v1/payments/history', method: 'GET', name: 'Get Payment History' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Subscription',
        ...endpoint
      }, token);
      await this.delay(100);
    }
  }

  private async testJobManagementEndpoints(token: string): Promise<void> {
    console.log('\n💼 PHASE 4: JOB MANAGEMENT');
    console.log('===========================');

    const endpoints = [
      { path: '/api/v1/applications', method: 'GET', name: 'Get Job Applications' },
      { path: '/api/v1/matching/recommendations?limit=5', method: 'GET', name: 'Get Job Recommendations' },
      { path: '/api/v1/matching/analytics', method: 'GET', name: 'Get Matching Analytics' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Job Management',
        ...endpoint
      }, token);
      await this.delay(100);
    }
  }

  private async testNotificationEndpoints(token: string): Promise<void> {
    console.log('\n📧 PHASE 5: NOTIFICATION SYSTEM');
    console.log('================================');

    const endpoints = [
      { path: '/api/v1/notifications', method: 'GET', name: 'Get Notifications' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Notifications',
        ...endpoint
      }, token);
      await this.delay(100);
    }
  }

  private async testAdminEndpoints(token: string): Promise<void> {
    console.log('\n👑 PHASE 6: ADMIN DASHBOARD');
    console.log('============================');

    const endpoints = [
      { path: '/api/v1/admin/dashboard', method: 'GET', name: 'Admin Dashboard' },
      { path: '/api/v1/admin/dashboard/stats', method: 'GET', name: 'Dashboard Stats' },
      { path: '/api/v1/admin/users?limit=10', method: 'GET', name: 'Admin Users' },
      { path: '/api/v1/admin/jobs?limit=10', method: 'GET', name: 'Admin Jobs' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint({
        category: 'Admin',
        ...endpoint
      }, token);
      await this.delay(100);
    }
  }

  private async testEndpoint(endpoint: any, token?: string): Promise<TestResult> {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = Date.now();

    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        headers,
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        category: endpoint.category,
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: response.status,
        success: true,
        responseTime
      };

      console.log(`✅ ${endpoint.name} - ${response.status} (${responseTime}ms)`);
      this.results.push(result);
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.error?.message || error.message;
      
      const result: TestResult = {
        category: endpoint.category,
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: typeof status === 'number' ? status : 0,
        success: false,
        error: message,
        responseTime
      };

      console.log(`❌ ${endpoint.name} - ${status} - ${message} (${responseTime}ms)`);
      this.results.push(result);
      return result;
    }
  }

  private showResults(): void {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');

    // Overall statistics
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const avgResponseTime = this.results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / this.results.filter(r => r.responseTime).length;

    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   Success Rate: ${((successful / total) * 100).toFixed(1)}%`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    console.log(`\n📋 RESULTS BY CATEGORY:`);
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categorySuccess = categoryResults.filter(r => r.success).length;
      const categoryRate = ((categorySuccess / categoryResults.length) * 100).toFixed(1);
      
      console.log(`\n   ${category}:`);
      console.log(`     Tests: ${categoryResults.length}, Success: ${categorySuccess}, Rate: ${categoryRate}%`);
      
      categoryResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
        console.log(`       ${status} ${result.name} - ${result.status}${time}`);
        if (!result.success && result.error) {
          console.log(`         Error: ${result.error}`);
        }
      });
    });

    // Failed tests summary
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log(`\n❌ FAILED TESTS SUMMARY:`);
      failedTests.forEach(test => {
        console.log(`   ${test.category} - ${test.name}: ${test.status} - ${test.error}`);
      });

      console.log(`\n🔧 RECOMMENDATIONS:`);
      
      const authFailures = failedTests.filter(r => r.status === 401);
      if (authFailures.length > 0) {
        console.log(`   1. 🔑 Authentication Issues (${authFailures.length}):`);
        console.log(`      - Get a fresh Clerk token from: http://localhost:8080/src/jwt.html`);
        console.log(`      - Use the token cache: npx ts-node scripts/tokenCache.ts add <token>`);
      }

      const notFoundFailures = failedTests.filter(r => r.status === 404);
      if (notFoundFailures.length > 0) {
        console.log(`   2. 🔍 Not Found Issues (${notFoundFailures.length}):`);
        console.log(`      - Check if endpoint paths are correct in routes`);
        console.log(`      - Verify route registration in src/routes/index.ts`);
      }

      const serverErrors = failedTests.filter(r => r.status >= 500);
      if (serverErrors.length > 0) {
        console.log(`   3. 💥 Server Errors (${serverErrors.length}):`);
        console.log(`      - Check server logs for detailed error information`);
        console.log(`      - Verify database connection and configuration`);
      }
    }

    console.log(`\n🎉 Testing complete! Check the results above for details.`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const tester = new ComprehensiveTester();
  await tester.start();
}

if (require.main === module) {
  main().catch(console.error);
}

export { ComprehensiveTester };