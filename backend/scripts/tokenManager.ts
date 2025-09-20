#!/usr/bin/env ts-node

/**
 * Interactive Token Manager
 * 
 * This script provides an interactive interface to manage Clerk tokens
 * and test endpoints without worrying about token expiration.
 */

import axios from 'axios';
import { TokenCache } from './tokenCache';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  path: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
}

class TokenManager {
  private cache = new TokenCache();
  private results: TestResult[] = [];

  async start(): Promise<void> {
    console.log('🎯 INTERACTIVE TOKEN MANAGER');
    console.log('============================');
    console.log('This tool helps you manage Clerk tokens and test endpoints.');
    console.log('');

    // Check for existing valid token
    const existingToken = this.cache.getValidToken();
    if (existingToken) {
      console.log('✅ Found valid cached token!');
      await this.showMenu(existingToken);
      return;
    }

    console.log('❌ No valid cached token found.');
    console.log('Please get a fresh token from: http://localhost:8080/src/jwt.html');
    console.log('');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const token = await new Promise<string>((resolve) => {
      rl.question('🔑 Paste your fresh Clerk token: ', (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!token) {
      console.log('❌ No token provided. Exiting...');
      return;
    }

    // Cache the token
    this.cache.addToken(token);
    await this.showMenu(token);
  }

  private async showMenu(token: string): Promise<void> {
    while (true) {
      console.log('\n📋 MENU OPTIONS:');
      console.log('1. Test all endpoints');
      console.log('2. Test specific endpoint');
      console.log('3. Check token status');
      console.log('4. Add new token');
      console.log('5. Show test results');
      console.log('6. Exit');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const choice = await new Promise<string>((resolve) => {
        rl.question('\n👉 Choose an option (1-6): ', (answer: string) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      switch (choice) {
        case '1':
          await this.testAllEndpoints(token);
          break;
        case '2':
          await this.testSpecificEndpoint(token);
          break;
        case '3':
          this.cache.showStatus();
          break;
        case '4':
          await this.addNewToken();
          break;
        case '5':
          this.showResults();
          break;
        case '6':
          console.log('👋 Goodbye!');
          return;
        default:
          console.log('❌ Invalid option. Please choose 1-6.');
      }
    }
  }

  private async testAllEndpoints(token: string): Promise<void> {
    console.log('\n🚀 TESTING ALL ENDPOINTS');
    console.log('========================');

    const endpoints = [
      // Public endpoints
      { path: '/health', method: 'GET', name: 'Health Check', auth: false },
      { path: '/api/v1', method: 'GET', name: 'API Documentation', auth: false },
      { path: '/api/v1/jobs?limit=10', method: 'GET', name: 'Get Jobs', auth: false },
      { path: '/api/v1/jobs/search?q=engineer', method: 'GET', name: 'Search Jobs', auth: false },
      
      // Authenticated endpoints
      { path: '/api/v1/clerk-auth/me', method: 'GET', name: 'Get Current User', auth: true },
      { path: '/api/v1/users/profile', method: 'GET', name: 'Get User Profile', auth: true },
      { path: '/api/v1/users/profile/completion', method: 'GET', name: 'Profile Completion', auth: true },
      { path: '/api/v1/subscriptions/plans', method: 'GET', name: 'Subscription Plans', auth: true },
      { path: '/api/v1/subscriptions/status', method: 'GET', name: 'Subscription Status', auth: true },
      { path: '/api/v1/payments/history', method: 'GET', name: 'Payment History', auth: true },
      { path: '/api/v1/notifications', method: 'GET', name: 'Notifications', auth: true },
      
      // Corrected paths
      { path: '/api/v1/applications', method: 'GET', name: 'Job Applications', auth: true },
      { path: '/api/v1/matching/recommendations?limit=5', method: 'GET', name: 'Job Recommendations', auth: true },
      { path: '/api/v1/matching/analytics', method: 'GET', name: 'Matching Analytics', auth: true },
      
      // Admin endpoints
      { path: '/api/v1/admin/dashboard', method: 'GET', name: 'Admin Dashboard', auth: true },
      { path: '/api/v1/admin/dashboard/stats', method: 'GET', name: 'Dashboard Stats', auth: true },
      { path: '/api/v1/admin/users?limit=10', method: 'GET', name: 'Admin Users', auth: true },
      { path: '/api/v1/admin/jobs?limit=10', method: 'GET', name: 'Admin Jobs', auth: true }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint, endpoint.auth ? token : undefined);
      await this.delay(200); // Small delay between requests
    }

    this.showResults();
  }

  private async testSpecificEndpoint(token: string): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const path = await new Promise<string>((resolve) => {
      rl.question('🔍 Enter endpoint path (e.g., /api/v1/users/profile): ', (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    const method = await new Promise<string>((resolve) => {
      rl.question('📝 Enter method (GET, POST, PUT, DELETE): ', (answer: string) => {
        rl.close();
        resolve(answer.trim().toUpperCase());
      });
    });

    const needsAuth = await new Promise<boolean>((resolve) => {
      rl.question('🔐 Does this endpoint need authentication? (y/n): ', (answer: string) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });

    await this.testEndpoint({
      path,
      method,
      name: `Custom: ${method} ${path}`,
      auth: needsAuth
    }, needsAuth ? token : undefined);
  }

  private async testEndpoint(endpoint: any, token?: string): Promise<TestResult> {
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

      const result: TestResult = {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: response.status,
        success: true
      };

      console.log(`✅ ${endpoint.name} - ${response.status}`);
      this.results.push(result);
      return result;
    } catch (error: any) {
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.error?.message || error.message;
      
      const result: TestResult = {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: typeof status === 'number' ? status : 0,
        success: false,
        error: message
      };

      console.log(`❌ ${endpoint.name} - ${status} - ${message}`);
      this.results.push(result);
      return result;
    }
  }

  private async addNewToken(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const token = await new Promise<string>((resolve) => {
      rl.question('🔑 Paste your new Clerk token: ', (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (token) {
      this.cache.addToken(token);
      console.log('✅ New token cached successfully!');
    }
  }

  private showResults(): void {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ${r.name}: ${r.status} - ${r.error}`);
        });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const manager = new TokenManager();
  await manager.start();
}

if (require.main === module) {
  main().catch(console.error);
}

export { TokenManager };

