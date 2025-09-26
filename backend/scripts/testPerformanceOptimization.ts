import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

class PerformanceTestRunner {
  private adminToken: string | null = null;
  private results: { name: string; status: string; details?: any }[] = [];

  private addResult(name: string, status: string, details?: any) {
    this.results.push({ name, status, details });
    console.log(`[${status === 'PASS' ? '✅' : '❌'}] ${name}`);
    if (details) {
      console.log('   Details:', details);
    }
  }

  private async adminLogin(): Promise<string | null> {
    console.log('\n🔑 Attempting Admin Login...');
    try {
      const response = await axios.post(`${BASE_URL}${API_VERSION}/auth/login`, {
        email: 'admin@notifyx.com',
        password: 'Admin123!'
      });

      if (response.status === 200 && response.data.success) {
        this.adminToken = response.data.data.accessToken;
        this.addResult('Admin Login', 'PASS');
        return this.adminToken;
      } else {
        this.addResult('Admin Login', 'FAIL', response.data);
        return null;
      }
    } catch (error: any) {
      this.addResult('Admin Login', 'FAIL', `Admin login error: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }

  async testPerformanceStats(): Promise<void> {
    console.log('\n📊 Testing Get Performance Stats...');
    if (!this.adminToken) {
      this.addResult('Get Performance Stats', 'FAIL', 'No admin token available');
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/performance/stats`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      if (response.status === 200 && response.data.success) {
        this.addResult('Get Performance Stats', 'PASS', response.data.data);
      } else {
        this.addResult('Get Performance Stats', 'FAIL', response.data);
      }
    } catch (error: any) {
      this.addResult('Get Performance Stats', 'FAIL', error.response?.data || error.message);
    }
  }

  async testRecentMetrics(): Promise<void> {
    console.log('\n📈 Testing Get Recent Metrics...');
    if (!this.adminToken) {
      this.addResult('Get Recent Metrics', 'FAIL', 'No admin token available');
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/performance/metrics`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      if (response.status === 200 && response.data.success) {
        this.addResult('Get Recent Metrics', 'PASS', response.data.data);
      } else {
        this.addResult('Get Recent Metrics', 'FAIL', response.data);
      }
    } catch (error: any) {
      this.addResult('Get Recent Metrics', 'FAIL', error.response?.data || error.message);
    }
  }

  async testIndexStats(): Promise<void> {
    console.log('\n🗂️ Testing Get Index Stats...');
    if (!this.adminToken) {
      this.addResult('Get Index Stats', 'FAIL', 'No admin token available');
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}${API_VERSION}/performance/indexes`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      if (response.status === 200 && response.data.success) {
        this.addResult('Get Index Stats', 'PASS', response.data.data);
      } else {
        this.addResult('Get Index Stats', 'FAIL', response.data);
      }
    } catch (error: any) {
      this.addResult('Get Index Stats', 'FAIL', error.response?.data || error.message);
    }
  }

  async testQueryAnalysis(): Promise<void> {
    console.log('\n🔍 Testing Query Analysis...');
    if (!this.adminToken) {
      this.addResult('Query Analysis', 'FAIL', 'No admin token available');
      return;
    }
    try {
      const response = await axios.post(`${BASE_URL}${API_VERSION}/performance/analyze`, {}, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      if (response.status === 200 && response.data.success) {
        this.addResult('Query Analysis', 'PASS', response.data.data);
      } else {
        this.addResult('Query Analysis', 'FAIL', response.data);
      }
    } catch (error: any) {
      this.addResult('Query Analysis', 'FAIL', error.response?.data || error.message);
    }
  }

  async testClearMetrics(): Promise<void> {
    console.log('\n🗑️ Testing Clear Metrics...');
    if (!this.adminToken) {
      this.addResult('Clear Metrics', 'FAIL', 'No admin token available');
      return;
    }
    try {
      const response = await axios.delete(`${BASE_URL}${API_VERSION}/performance/clear`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      if (response.status === 200 && response.data.success) {
        this.addResult('Clear Metrics', 'PASS', response.data.message);
      } else {
        this.addResult('Clear Metrics', 'FAIL', response.data);
      }
    } catch (error: any) {
      this.addResult('Clear Metrics', 'FAIL', error.response?.data || error.message);
    }
  }

  async testDatabaseOperations(): Promise<void> {
    console.log('\n💾 Testing Database Operations for Performance Monitoring...');
    if (!this.adminToken) {
      this.addResult('Database Operations', 'FAIL', 'No admin token available');
      return;
    }
    
    try {
      // Test various operations that should be monitored
      const operations = [
        { name: 'Get Jobs', url: `${BASE_URL}${API_VERSION}/jobs?limit=5` },
        { name: 'Get Users', url: `${BASE_URL}${API_VERSION}/users?limit=5` },
        { name: 'Get Subscriptions', url: `${BASE_URL}${API_VERSION}/subscriptions?limit=5` }
      ];

      for (const op of operations) {
        try {
          const response = await axios.get(op.url, {
            headers: { Authorization: `Bearer ${this.adminToken}` }
          });
          if (response.status === 200) {
            console.log(`   ✅ ${op.name} completed`);
          }
        } catch (error: any) {
          console.log(`   ⚠️ ${op.name} failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }

      this.addResult('Database Operations', 'PASS', 'Database operations completed for performance monitoring');
    } catch (error: any) {
      this.addResult('Database Operations', 'FAIL', error.response?.data || error.message);
    }
  }

  async runTests() {
    console.log('🚀 Starting Performance Optimization Tests...');

    // 1. Admin Login
    const loggedIn = await this.adminLogin();
    if (!loggedIn) {
      console.log('\n❌ Cannot proceed without admin authentication');
      return;
    }

    // 2. Test Database Operations (to generate some metrics)
    await this.testDatabaseOperations();

    // 3. Test Performance Stats
    await this.testPerformanceStats();

    // 4. Test Recent Metrics
    await this.testRecentMetrics();

    // 5. Test Index Stats
    await this.testIndexStats();

    // 6. Test Query Analysis
    await this.testQueryAnalysis();

    // 7. Test Clear Metrics
    await this.testClearMetrics();

    console.log('\n--- Performance Optimization Test Results ---');
    this.results.forEach(result => {
      console.log(`[${result.status === 'PASS' ? '✅' : '❌'}] ${result.name}`);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });
    console.log('------------------------------------------');
  }
}

const runner = new PerformanceTestRunner();
runner.runTests();