#!/usr/bin/env ts-node

/**
 * Clerk Token Refresh Script
 * 
 * This script helps manage Clerk token expiration by:
 * 1. Monitoring token expiration
 * 2. Automatically refreshing tokens
 * 3. Providing a testing interface with fresh tokens
 */

import axios from 'axios';
import { config } from '../src/config/environment';

interface TokenInfo {
  token: string;
  expiresAt: Date;
  userId: string;
  sessionId: string;
}

class TokenManager {
  private currentToken: string | null = null;
  private tokenInfo: TokenInfo | null = null;

  /**
   * Decode JWT token to get expiration info
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or expiring soon
   */
  isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds

    return (expirationTime - currentTime) < bufferTime;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Test an endpoint with the current token
   */
  async testEndpoint(endpoint: string, token: string): Promise<any> {
    try {
      console.log(`🧪 Testing endpoint: ${endpoint}`);
      
      const response = await axios.get(`http://localhost:3000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      return { success: true, status: response.status, data: response.data };
    } catch (error: any) {
      console.log(`❌ ${endpoint} - Status: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
      return { success: false, status: error.response?.status, error: error.response?.data || error.message };
    }
  }

  /**
   * Test all endpoints with current token
   */
  async testAllEndpoints(token: string): Promise<void> {
    console.log('\n🚀 COMPREHENSIVE ENDPOINT TESTING');
    console.log('=====================================');

    // Test endpoints that don't require authentication first
    console.log('\n📋 Testing Public Endpoints:');
    await this.testEndpoint('/health', token);
    await this.testEndpoint('/api/v1', token);
    await this.testEndpoint('/api/v1/jobs?limit=10', token);

    // Test authenticated endpoints
    console.log('\n🔐 Testing Authenticated Endpoints:');
    await this.testEndpoint('/api/v1/clerk-auth/me', token);
    await this.testEndpoint('/api/v1/users/profile', token);
    await this.testEndpoint('/api/v1/users/profile/completion', token);
    await this.testEndpoint('/api/v1/subscriptions/plans', token);
    await this.testEndpoint('/api/v1/subscriptions/status', token);
    await this.testEndpoint('/api/v1/payments/history', token);
    await this.testEndpoint('/api/v1/notifications', token);

    // Test corrected endpoint paths
    console.log('\n🔧 Testing Corrected Endpoint Paths:');
    await this.testEndpoint('/api/v1/applications', token);
    await this.testEndpoint('/api/v1/matching/recommendations?limit=5', token);
    await this.testEndpoint('/api/v1/matching/analytics', token);

    // Test admin endpoints
    console.log('\n👑 Testing Admin Endpoints:');
    await this.testEndpoint('/api/v1/admin/dashboard', token);
    await this.testEndpoint('/api/v1/admin/dashboard/stats', token);
    await this.testEndpoint('/api/v1/admin/users?limit=10', token);
    await this.testEndpoint('/api/v1/admin/jobs?limit=10', token);
  }

  /**
   * Interactive token testing
   */
  async startInteractiveMode(): Promise<void> {
    console.log('\n🎯 CLERK TOKEN TESTING INTERFACE');
    console.log('==================================');
    console.log('This tool helps you test endpoints with fresh Clerk tokens.');
    console.log('Since Clerk tokens expire quickly, you can:');
    console.log('1. Paste a fresh token');
    console.log('2. Test all endpoints immediately');
    console.log('3. Get a detailed report\n');

    // Get token from user
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

    // Validate token format
    if (!token.includes('.')) {
      console.log('❌ Invalid token format. Please provide a valid JWT token.');
      return;
    }

    // Decode and display token info
    const payload = this.decodeToken(token);
    if (payload) {
      const expiresAt = this.getTokenExpiration(token);
      console.log('\n📊 Token Information:');
      console.log(`   User ID: ${payload.sub}`);
      console.log(`   Session ID: ${payload.sid}`);
      console.log(`   Expires At: ${expiresAt?.toLocaleString()}`);
      console.log(`   Issued At: ${new Date(payload.iat * 1000).toLocaleString()}`);
      
      if (this.isTokenExpired(token)) {
        console.log('⚠️  WARNING: Token is expired or expiring very soon!');
        console.log('   Please get a fresh token from Clerk dashboard or jwt.html page.');
        return;
      } else {
        console.log('✅ Token is valid and not expiring soon.');
      }
    }

    // Test all endpoints
    await this.testAllEndpoints(token);

    console.log('\n🎉 Testing Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Fix any 404 errors by checking endpoint paths');
    console.log('2. Fix any 401 errors by getting a fresh token');
    console.log('3. Fix any 500 errors by checking server logs');
  }
}

// Main execution
async function main() {
  const tokenManager = new TokenManager();
  await tokenManager.startInteractiveMode();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { TokenManager };

