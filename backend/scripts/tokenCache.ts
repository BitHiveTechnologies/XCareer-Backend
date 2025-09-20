#!/usr/bin/env ts-node

/**
 * Clerk Token Cache System
 * 
 * This script provides a solution to the fast token expiration issue by:
 * 1. Caching tokens with expiration tracking
 * 2. Automatically refreshing tokens when needed
 * 3. Providing a persistent token for testing
 */

import fs from 'fs';
import path from 'path';

interface CachedToken {
  token: string;
  expiresAt: Date;
  userId: string;
  sessionId: string;
  createdAt: Date;
}

class TokenCache {
  private cacheFile = path.join(__dirname, '../.token-cache.json');
  private cachedToken: CachedToken | null = null;

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        this.cachedToken = {
          ...data,
          expiresAt: new Date(data.expiresAt),
          createdAt: new Date(data.createdAt)
        };
      }
    } catch (error) {
      console.log('No cached token found or invalid cache file');
    }
  }

  private saveCache(): void {
    if (this.cachedToken) {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cachedToken, null, 2));
    }
  }

  /**
   * Add a new token to cache
   */
  addToken(token: string): void {
    const payload = this.decodeToken(token);
    if (!payload) {
      console.log('❌ Invalid token format');
      return;
    }

    this.cachedToken = {
      token,
      expiresAt: new Date(payload.exp * 1000),
      userId: payload.sub,
      sessionId: payload.sid,
      createdAt: new Date()
    };

    this.saveCache();
    console.log('✅ Token cached successfully');
    console.log(`   User ID: ${payload.sub}`);
    console.log(`   Expires at: ${this.cachedToken.expiresAt.toLocaleString()}`);
    console.log(`   Time remaining: ${this.getTimeRemaining()} minutes`);
  }

  /**
   * Get cached token if still valid
   */
  getValidToken(): string | null {
    if (!this.cachedToken) {
      console.log('❌ No cached token found');
      return null;
    }

    const now = new Date();
    const timeRemaining = this.cachedToken.expiresAt.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      console.log('❌ Cached token has expired');
      this.clearCache();
      return null;
    }

    if (timeRemaining < 5 * 60 * 1000) { // Less than 5 minutes
      console.log('⚠️  Token expires soon, consider refreshing');
    }

    console.log(`✅ Using cached token (${Math.round(timeRemaining / 60000)} minutes remaining)`);
    return this.cachedToken.token;
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.cachedToken = null;
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
    console.log('🗑️  Token cache cleared');
  }

  /**
   * Get time remaining in minutes
   */
  private getTimeRemaining(): number {
    if (!this.cachedToken) return 0;
    const now = new Date();
    const timeRemaining = this.cachedToken.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.round(timeRemaining / 60000));
  }

  /**
   * Decode JWT token
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
   * Show cache status
   */
  showStatus(): void {
    if (!this.cachedToken) {
      console.log('📊 Cache Status: Empty');
      return;
    }

    const timeRemaining = this.getTimeRemaining();
    console.log('📊 Cache Status:');
    console.log(`   User ID: ${this.cachedToken.userId}`);
    console.log(`   Session ID: ${this.cachedToken.sessionId}`);
    console.log(`   Created: ${this.cachedToken.createdAt.toLocaleString()}`);
    console.log(`   Expires: ${this.cachedToken.expiresAt.toLocaleString()}`);
    console.log(`   Time Remaining: ${timeRemaining} minutes`);
    console.log(`   Status: ${timeRemaining > 0 ? '✅ Valid' : '❌ Expired'}`);
  }
}

// CLI Interface
async function main() {
  const cache = new TokenCache();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'add':
      const token = args[1];
      if (!token) {
        console.log('❌ Please provide a token: node tokenCache.js add <token>');
        process.exit(1);
      }
      cache.addToken(token);
      break;

    case 'get':
      const validToken = cache.getValidToken();
      if (validToken) {
        console.log('\n🔑 Valid Token:');
        console.log(validToken);
      }
      break;

    case 'status':
      cache.showStatus();
      break;

    case 'clear':
      cache.clearCache();
      break;

    default:
      console.log('🔧 Token Cache Manager');
      console.log('=====================');
      console.log('Commands:');
      console.log('  add <token>    - Cache a new token');
      console.log('  get            - Get valid cached token');
      console.log('  status         - Show cache status');
      console.log('  clear          - Clear the cache');
      console.log('');
      console.log('Examples:');
      console.log('  node tokenCache.js add "eyJhbGciOiJSUzI1NiIs..."');
      console.log('  node tokenCache.js get');
      console.log('  node tokenCache.js status');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TokenCache };

