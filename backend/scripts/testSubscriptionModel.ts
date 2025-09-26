#!/usr/bin/env ts-node

/**
 * Comprehensive Test Suite for Enhanced Subscription Model
 * 
 * This script tests all the enhanced features of the subscription model including:
 * - New fields and validation
 * - Enhanced instance methods
 * - Advanced static methods
 * - Database operations
 * - Business logic validation
 */

// Set NODE_ENV to test for flexible date validation
process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Subscription } from '../src/models/Subscription';
import { User } from '../src/models/User';
import { logger } from '../src/utils/logger';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3
};

// Test results tracking
let testResults: { [key: string]: { passed: number; failed: number; total: number } } = {};
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

// Helper function to log test results
function logTestResult(testName: string, passed: boolean, error?: any, details?: string) {
  totalTests++;
  if (passed) {
    totalPassed++;
    logger.info(`✅ ${testName}`, { details });
  } else {
    totalFailed++;
    logger.error(`❌ ${testName}`, { error: error?.message || error, details });
  }
}

// Helper function to create test user
async function createTestUser() {
  try {
    // Check if test user already exists
    let user = await User.findOne({ email: 'subscription-test@example.com' });
    
    if (!user) {
      user = new User({
        email: 'subscription-test@example.com',
        password: 'TestPassword123!',
        name: 'Subscription Test User',
        mobile: '9876543210',
        qualification: 'B.Tech',
        stream: 'Computer Science',
        yearOfPassout: '2020',
        cgpaOrPercentage: '85',
        subscriptionStatus: 'inactive'
      });
      
      await user.save();
      logger.info('Test user created successfully');
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to create test user', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Test 1: Enhanced Subscription Model Fields
async function testEnhancedFields() {
  logger.info('🧪 Testing Enhanced Subscription Model Fields...');
  
  try {
    const user = await createTestUser();
    
    // Test subscription with all new fields
    const subscription = new Subscription({
      userId: user._id,
      plan: 'enterprise',
      amount: 299,
      paymentId: 'test_payment_123',
      orderId: 'test_order_123',
      status: 'completed',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      metadata: {
        source: 'web',
        campaign: 'summer2024',
        referrer: 'google',
        notes: 'Test subscription for enhanced model'
      }
    });
    
    await subscription.save();
    
    // Test field validation
    const savedSubscription = await Subscription.findById(subscription._id);
    
    if (savedSubscription) {
      logTestResult('Enhanced fields saved correctly', true);
      logTestResult('Enterprise plan validation', savedSubscription.plan === 'enterprise');
      logTestResult('Auto-renewal setting', savedSubscription.autoRenew === true);
      logTestResult('Trial end date set', savedSubscription.trialEndDate !== undefined);
      logTestResult('Metadata source', savedSubscription.metadata?.source === 'web');
      logTestResult('Metadata campaign', savedSubscription.metadata?.campaign === 'summer2024');
    } else {
      logTestResult('Enhanced fields saved correctly', false, 'Subscription not found after save');
    }
    
    // Clean up
    await Subscription.findByIdAndDelete(subscription._id);
    
  } catch (error) {
    logTestResult('Enhanced fields test', false, error);
  }
}

// Test 2: Enhanced Instance Methods
async function testEnhancedInstanceMethods() {
  logger.info('🧪 Testing Enhanced Instance Methods...');
  
  try {
    const user = await createTestUser();
    
    const subscription = new Subscription({
      userId: user._id,
      plan: 'premium',
      amount: 99,
      paymentId: 'test_payment_456',
      orderId: 'test_order_456',
      status: 'completed',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      autoRenew: true,
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      metadata: {
        source: 'mobile',
        campaign: 'winter2024'
      }
    });
    
    await subscription.save();
    
    // Test enhanced instance methods
    logTestResult('isInTrial method', (subscription as any).isInTrial());
    logTestResult('getTrialDaysRemaining method', (subscription as any).getTrialDaysRemaining() > 0);
    logTestResult('canRenew method', (subscription as any).canRenew());
    logTestResult('isExpiringSoon method', !(subscription as any).isExpiringSoon());
    logTestResult('getSubscriptionValue method', (subscription as any).getSubscriptionValue() === 99);
    logTestResult('getPlanDisplay method', (subscription as any).getPlanDisplay().includes('Premium'));
    logTestResult('getStatusDisplay method', (subscription as any).getStatusDisplay() === 'Active');
    
    // Clean up
    await Subscription.findByIdAndDelete(subscription._id);
    
  } catch (error) {
    logTestResult('Enhanced instance methods test', false, error);
  }
}

// Test 3: Enhanced Static Methods
async function testEnhancedStaticMethods() {
  logger.info('🧪 Testing Enhanced Static Methods...');
  
  try {
    const user = await createTestUser();
    
    // Create multiple test subscriptions
        const subscriptions = [
          {
            userId: user._id,
            plan: 'basic',
            amount: 49,
            paymentId: 'test_payment_1',
            orderId: 'test_order_1',
            status: 'completed',
            startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (active)
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Expires in 5 days
            autoRenew: true,
            metadata: { source: 'web', campaign: 'test1' }
          },
          {
            userId: user._id,
            plan: 'premium',
            amount: 99,
            paymentId: 'test_payment_2',
            orderId: 'test_order_2',
            status: 'completed',
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (active)
            endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expires in 3 days
            autoRenew: false,
            metadata: { source: 'mobile', campaign: 'test2' }
          },
          {
            userId: user._id,
            plan: 'enterprise',
            amount: 299,
            paymentId: 'test_payment_3',
            orderId: 'test_order_3',
            status: 'cancelled',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            autoRenew: false,
            metadata: { source: 'admin', campaign: 'test3' }
          }
        ];
    
    const createdSubscriptions = await Subscription.insertMany(subscriptions);
    
    // Test static methods
    const activeSubscriptions = await (Subscription as any).findActiveSubscriptions();
    logTestResult('findActiveSubscriptions method', activeSubscriptions.length >= 2);
    
    const expiringSubscriptions = await (Subscription as any).findExpiringSubscriptions(30);
    logTestResult('findExpiringSubscriptions method', expiringSubscriptions.length >= 2);
    
    const userSubscriptions = await (Subscription as any).findByUser(user._id.toString());
    logTestResult('findByUser method', userSubscriptions.length === 3);
    
    const completedSubscriptions = await (Subscription as any).findByStatus('completed');
    logTestResult('findByStatus method', completedSubscriptions.length >= 2);
    
    const premiumSubscriptions = await (Subscription as any).findByPlan('premium');
    logTestResult('findByPlan method', premiumSubscriptions.length >= 1);
    
    const webSubscriptions = await (Subscription as any).findBySource('web');
    logTestResult('findBySource method', webSubscriptions.length >= 1);
    
    const campaignSubscriptions = await (Subscription as any).findByCampaign('test1');
    logTestResult('findByCampaign method', campaignSubscriptions.length >= 1);
    
    const statistics = await (Subscription as any).getStatistics();
    logTestResult('getStatistics method', statistics.total >= 3);
    logTestResult('Statistics active count', statistics.active >= 2);
    
    // Clean up
    await Subscription.deleteMany({ userId: user._id });
    
  } catch (error) {
    logTestResult('Enhanced static methods test', false, error);
  }
}

// Test 4: Database Indexes and Performance
async function testDatabaseIndexes() {
  logger.info('🧪 Testing Database Indexes and Performance...');
  
  try {
    const user = await createTestUser();
    
    // Create a subscription with all fields
    const subscription = new Subscription({
      userId: user._id,
      plan: 'premium',
      amount: 99,
      paymentId: 'perf_test_payment',
      orderId: 'perf_test_order',
      status: 'completed',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        source: 'api',
        campaign: 'performance_test',
        referrer: 'direct',
        notes: 'Performance test subscription'
      }
    });
    
    await subscription.save();
    
    // Test index performance with various queries
    const startTime = Date.now();
    
    // Test compound index queries
    await Subscription.find({ userId: user._id, status: 'completed' });
    await Subscription.find({ status: 'completed', startDate: { $gte: new Date() } });
    await Subscription.find({ plan: 'premium', status: 'completed' });
    await Subscription.find({ 'metadata.source': 'api' });
    await Subscription.find({ 'metadata.campaign': 'performance_test' });
    
    const queryTime = Date.now() - startTime;
    
    logTestResult('Database query performance', queryTime < 1000, null, `Query time: ${queryTime}ms`);
    
    // Test aggregation performance
    const aggStartTime = Date.now();
    const stats = await (Subscription as any).getStatistics();
    const aggTime = Date.now() - aggStartTime;
    
    logTestResult('Aggregation performance', aggTime < 500, null, `Aggregation time: ${aggTime}ms`);
    
    // Clean up
    await Subscription.findByIdAndDelete(subscription._id);
    
  } catch (error) {
    logTestResult('Database indexes test', false, error);
  }
}

// Test 5: Business Logic Validation
async function testBusinessLogicValidation() {
  logger.info('🧪 Testing Business Logic Validation...');
  
  try {
    const user = await createTestUser();
    
    // Test plan validation
    try {
      const invalidSubscription = new Subscription({
        userId: user._id,
        plan: 'invalid_plan',
        amount: 99,
        paymentId: 'test_payment',
        orderId: 'test_order',
        status: 'completed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
      await invalidSubscription.save();
      logTestResult('Invalid plan validation', false, 'Should have failed for invalid plan');
    } catch (error) {
      logTestResult('Invalid plan validation', true, null, 'Correctly rejected invalid plan');
    }
    
    // Test amount validation
    try {
      const invalidAmountSubscription = new Subscription({
        userId: user._id,
        plan: 'premium',
        amount: 50, // Wrong amount for premium plan
        paymentId: 'test_payment',
        orderId: 'test_order',
        status: 'completed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
      await invalidAmountSubscription.save();
      logTestResult('Invalid amount validation', false, 'Should have failed for invalid amount');
    } catch (error) {
      logTestResult('Invalid amount validation', true, null, 'Correctly rejected invalid amount');
    }
    
    // Test date validation
    try {
      const invalidDateSubscription = new Subscription({
        userId: user._id,
        plan: 'basic',
        amount: 49,
        paymentId: 'test_payment',
        orderId: 'test_order',
        status: 'completed',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future start date
        endDate: new Date() // Past end date
      });
      await invalidDateSubscription.save();
      logTestResult('Invalid date validation', false, 'Should have failed for invalid dates');
    } catch (error) {
      logTestResult('Invalid date validation', true, null, 'Correctly rejected invalid dates');
    }
    
  } catch (error) {
    logTestResult('Business logic validation test', false, error);
  }
}

// Test 6: Subscription Lifecycle Management
async function testSubscriptionLifecycle() {
  logger.info('🧪 Testing Subscription Lifecycle Management...');
  
  try {
    const user = await createTestUser();
    
    // Create a subscription
    const subscription = new Subscription({
      userId: user._id,
      plan: 'basic',
      amount: 49,
      paymentId: 'lifecycle_test_payment',
      orderId: 'lifecycle_test_order',
      status: 'pending',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      metadata: { source: 'web', campaign: 'lifecycle_test' }
    });
    
    await subscription.save();
    
    // Test status transitions
    subscription.status = 'completed';
    await subscription.save();
    logTestResult('Status transition to completed', subscription.status === 'completed');
    
    // Test cancellation
    subscription.status = 'cancelled';
    subscription.cancellationDate = new Date();
    subscription.cancellationReason = 'User requested cancellation';
    await subscription.save();
    logTestResult('Subscription cancellation', subscription.status === 'cancelled');
    logTestResult('Cancellation date set', subscription.cancellationDate !== undefined);
    logTestResult('Cancellation reason set', subscription.cancellationReason === 'User requested cancellation');
    
    // Test expiry
    subscription.status = 'completed';
    subscription.endDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago (after startDate)
    await subscription.save();
    
    const isExpired = (subscription as any).isExpired();
    logTestResult('Subscription expiry check', isExpired);
    
    // Clean up
    await Subscription.findByIdAndDelete(subscription._id);
    
  } catch (error) {
    logTestResult('Subscription lifecycle test', false, error);
  }
}

// Main test execution
async function runAllTests() {
  logger.info('🚀 Starting Enhanced Subscription Model Test Suite...');
  
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Run all tests
    await testEnhancedFields();
    await testEnhancedInstanceMethods();
    await testEnhancedStaticMethods();
    await testDatabaseIndexes();
    await testBusinessLogicValidation();
    await testSubscriptionLifecycle();
    
    // Print final results
    logger.info('📊 Test Results Summary:');
    logger.info(`Total Tests: ${totalTests}`);
    logger.info(`Passed: ${totalPassed}`);
    logger.info(`Failed: ${totalFailed}`);
    logger.info(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed === 0) {
      logger.info('🎉 All tests passed! Enhanced subscription model is working correctly.');
    } else {
      logger.warn(`⚠️  ${totalFailed} tests failed. Please review the errors above.`);
    }
    
  } catch (error) {
    logger.error('Test suite execution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    // Clean up test user
    try {
      await User.findOneAndDelete({ email: 'subscription-test@example.com' });
      await Subscription.deleteMany({ userId: { $exists: true } });
      logger.info('Test data cleaned up');
    } catch (error) {
      logger.warn('Failed to clean up test data', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Close database connection
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
