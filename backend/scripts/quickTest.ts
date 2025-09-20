#!/usr/bin/env ts-node

/**
 * Quick API Testing Script
 * 
 * This script provides a fast way to test endpoints with fresh tokens
 * without waiting for token expiration issues.
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Corrected endpoint paths based on route analysis
const ENDPOINTS = {
  // Public endpoints (no auth required)
  public: [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/api/v1', method: 'GET', name: 'API Documentation' },
    { path: '/api/v1/jobs?limit=10', method: 'GET', name: 'Get Jobs' },
    { path: '/api/v1/jobs/search?q=engineer', method: 'GET', name: 'Search Jobs' }
  ],
  
  // Authenticated endpoints (require valid token)
  authenticated: [
    { path: '/api/v1/clerk-auth/me', method: 'GET', name: 'Get Current User' },
    { path: '/api/v1/users/profile', method: 'GET', name: 'Get User Profile' },
    { path: '/api/v1/users/profile/completion', method: 'GET', name: 'Profile Completion Status' },
    { path: '/api/v1/subscriptions/plans', method: 'GET', name: 'Subscription Plans' },
    { path: '/api/v1/subscriptions/status', method: 'GET', name: 'Subscription Status' },
    { path: '/api/v1/payments/history', method: 'GET', name: 'Payment History' },
    { path: '/api/v1/notifications', method: 'GET', name: 'Notifications' }
  ],
  
  // Corrected paths (these were returning 404)
  corrected: [
    { path: '/api/v1/applications', method: 'GET', name: 'Job Applications' },
    { path: '/api/v1/matching/recommendations?limit=5', method: 'GET', name: 'Job Recommendations' },
    { path: '/api/v1/matching/analytics', method: 'GET', name: 'Matching Analytics' }
  ],
  
  // Admin endpoints (require admin token)
  admin: [
    { path: '/api/v1/admin/dashboard', method: 'GET', name: 'Admin Dashboard' },
    { path: '/api/v1/admin/dashboard/stats', method: 'GET', name: 'Dashboard Stats' },
    { path: '/api/v1/admin/users?limit=10', method: 'GET', name: 'Admin Users' },
    { path: '/api/v1/admin/jobs?limit=10', method: 'GET', name: 'Admin Jobs' }
  ]
};

class QuickTester {
  private results: any[] = [];

  async testEndpoint(endpoint: any, token?: string): Promise<any> {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        headers,
        timeout: 10000
      });

      const result = {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: response.status,
        success: true,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };

      console.log(`✅ ${endpoint.name} - ${response.status}`);
      this.results.push(result);
      return result;
    } catch (error: any) {
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.error?.message || error.message;
      
      const result = {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status,
        success: false,
        error: message
      };

      console.log(`❌ ${endpoint.name} - ${status} - ${message}`);
      this.results.push(result);
      return result;
    }
  }

  async testPublicEndpoints(): Promise<void> {
    console.log('\n🌐 Testing Public Endpoints (No Auth Required)');
    console.log('================================================');
    
    for (const endpoint of ENDPOINTS.public) {
      await this.testEndpoint(endpoint);
      await this.delay(100); // Small delay between requests
    }
  }

  async testAuthenticatedEndpoints(token: string): Promise<void> {
    console.log('\n🔐 Testing Authenticated Endpoints');
    console.log('===================================');
    
    for (const endpoint of ENDPOINTS.authenticated) {
      await this.testEndpoint(endpoint, token);
      await this.delay(100);
    }
  }

  async testCorrectedEndpoints(token: string): Promise<void> {
    console.log('\n🔧 Testing Corrected Endpoint Paths');
    console.log('====================================');
    
    for (const endpoint of ENDPOINTS.corrected) {
      await this.testEndpoint(endpoint, token);
      await this.delay(100);
    }
  }

  async testAdminEndpoints(token: string): Promise<void> {
    console.log('\n👑 Testing Admin Endpoints');
    console.log('==========================');
    
    for (const endpoint of ENDPOINTS.admin) {
      await this.testEndpoint(endpoint, token);
      await this.delay(100);
    }
  }

  generateReport(): void {
    console.log('\n📊 TESTING REPORT');
    console.log('==================');
    
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      console.log(`   ${result.method} ${result.path} - ${result.status}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Categorize failures
    const authFailures = this.results.filter(r => !r.success && r.status === 401);
    const notFoundFailures = this.results.filter(r => !r.success && r.status === 404);
    const serverErrors = this.results.filter(r => !r.success && r.status >= 500);

    if (authFailures.length > 0) {
      console.log('🔑 Authentication Issues (401):');
      authFailures.forEach(f => console.log(`   - ${f.name}: ${f.path}`));
    }

    if (notFoundFailures.length > 0) {
      console.log('\n🔍 Not Found Issues (404):');
      notFoundFailures.forEach(f => console.log(`   - ${f.name}: ${f.path}`));
    }

    if (serverErrors.length > 0) {
      console.log('\n💥 Server Errors (500+):');
      serverErrors.forEach(f => console.log(`   - ${f.name}: ${f.path}`));
    }

    console.log('\n🎯 Recommendations:');
    if (authFailures.length > 0) {
      console.log('1. 🔑 Get a fresh Clerk token from jwt.html page');
      console.log('2. 🔑 Make sure token is not expired');
    }
    if (notFoundFailures.length > 0) {
      console.log('3. 🔍 Check if endpoint paths are correct in routes');
    }
    if (serverErrors.length > 0) {
      console.log('4. 💥 Check server logs for detailed error information');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution function
async function main() {
  const tester = new QuickTester();
  
  console.log('🚀 QUICK API TESTING SCRIPT');
  console.log('============================');
  console.log('This script tests all endpoints quickly with the correct paths.');
  console.log('');

  // Test public endpoints first
  await tester.testPublicEndpoints();

  // Get token from user for authenticated endpoints
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const token = await new Promise<string>((resolve) => {
    rl.question('\n🔑 Enter your Clerk token (or press Enter to skip authenticated tests): ', (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (token) {
    console.log('\n⏱️  Testing with your token...');
    
    // Test authenticated endpoints
    await tester.testAuthenticatedEndpoints(token);
    
    // Test corrected endpoints
    await tester.testCorrectedEndpoints(token);
    
    // Test admin endpoints
    await tester.testAdminEndpoints(token);
  } else {
    console.log('\n⏭️  Skipping authenticated tests (no token provided)');
  }

  // Generate comprehensive report
  tester.generateReport();
  
  console.log('\n🎉 Testing complete! Check the report above for details.');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { QuickTester };

