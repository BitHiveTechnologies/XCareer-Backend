#!/usr/bin/env ts-node

import { emailService } from '../utils/emailService';
import { emailQueueService } from '../utils/emailQueue';
import { logger } from '../utils/logger';

async function testEmailService() {
  ; void /* console.log */ ((..._args) => {})('🧪 Testing Email Service (No Redis Required)');
  ; void /* console.log */ ((..._args) => {})('==========================================\n');

  try {
    // Test 1: Verify email connection
    ; void /* console.log */ ((..._args) => {})('1. Testing email connection...');
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      ; void /* console.log */ ((..._args) => {})('✅ Email service connection successful');
    } else {
      ; void /* console.log */ ((..._args) => {})('❌ Email service connection failed');
      ; void /* console.log */ ((..._args) => {})('   This might be expected if using placeholder credentials');
    }

    // Test 2: Send a test email directly
    ; void /* console.log */ ((..._args) => {})('\n2. Testing direct email sending...');
    const testEmail = 'test@example.com';
    const success = await emailService.sendWelcomeEmail(testEmail, 'Test User');
    
    if (success) {
      ; void /* console.log */ ((..._args) => {})('✅ Direct email sending successful');
    } else {
      ; void /* console.log */ ((..._args) => {})('❌ Direct email sending failed');
    }

    // Test 3: Test New Email Methods
    ; void /* console.log */ ((..._args) => {})('\n3. Testing new email methods...');
    const testEmailReal = process.env.TEST_EMAIL || 'support@xcareers.in';
    
    ; void /* console.log */ ((..._args) => {})(`   Sending Upgrade Email to ${testEmailReal}...`);
    const upgradeSuccess = await emailService.sendSubscriptionUpgradeEmail(
      testEmailReal, 
      'Test User', 
      'premium', 
      ['Ad-free experience', 'Priority support', 'All templates']
    );
    ; void /* console.log */ ((..._args) => {})(upgradeSuccess ? '   ✅ Upgrade email success' : '   ❌ Upgrade email failed');

    ; void /* console.log */ ((..._args) => {})(`   Sending Credentials Email to ${testEmailReal}...`);
    const credsSuccess = await emailService.sendSubscriptionWelcomeCredentialsEmail(
      testEmailReal,
      'Test User',
      'temp-pass-123',
      'basic'
    );
    ; void /* console.log */ ((..._args) => {})(credsSuccess ? '   ✅ Credentials email success' : '   ❌ Credentials email failed');

    ; void /* console.log */ ((..._args) => {})(`   Sending Expiry Email to ${testEmailReal}...`);
    const expirySuccess = await emailService.sendSubscriptionExpiryEmail(
      testEmailReal,
      'Test User',
      'premium',
      7
    );
    ; void /* console.log */ ((..._args) => {})(expirySuccess ? '   ✅ Expiry email success' : '   ❌ Expiry email failed');

    ; void /* console.log */ ((..._args) => {})(`   Sending Password Changed Email to ${testEmailReal}...`);
    const passwordSuccess = await emailService.sendPasswordChangedEmail(testEmailReal, 'Test User');
    ; void /* console.log */ ((..._args) => {})(passwordSuccess ? '   ✅ Password changed email success' : '   ❌ Password changed email failed');

    // Test 4: Test email queue service (now processes immediately)
    ; void /* console.log */ ((..._args) => {})('\n4. Testing email queue service...');
    const queueJob = await emailQueueService.addEmailJob({
      to: testEmailReal,
      subject: 'Test Email from Queue',
      template: 'welcome',
      context: {
        name: 'Queue User',
        plan: 'basic'
      }
    });

    if (queueJob && queueJob.status === 'sent') {
      ; void /* console.log */ ((..._args) => {})('✅ Email queue service working');
      ; void /* console.log */ ((..._args) => {})(`   Job ID: ${queueJob.id}`);
    } else {
      ; void /* console.log */ ((..._args) => {})('❌ Email queue service failed');
    }

    // Test 5: Get queue statistics
    ; void /* console.log */ ((..._args) => {})('\n5. Email queue statistics:');
    const queueStatus = await emailQueueService.getQueueStatus();
    ; void /* console.log */ ((..._args) => {})(`   Completed: ${queueStatus.completed}`);
    ; void /* console.log */ ((..._args) => {})(`   Failed: ${queueStatus.failed}`);
    ; void /* console.log */ ((..._args) => {})(`   Waiting: ${queueStatus.waiting}`);
    ; void /* console.log */ ((..._args) => {})(`   Active: ${queueStatus.active}`);

    const stats = emailQueueService.getStats();
    ; void /* console.log */ ((..._args) => {})(`   Success Rate: ${stats.successRate}`);

    ; void /* console.log */ ((..._args) => {})('\n🎉 Email service testing completed!');
    ; void /* console.log */ ((..._args) => {})('\n📝 Notes:');
    ; void /* console.log */ ((..._args) => {})('- If emails failed to send, check your EMAIL_* environment variables');
    ; void /* console.log */ ((..._args) => {})('- The service will use Ethereal (test mode) if credentials are not configured');
    ; void /* console.log */ ((..._args) => {})('- No Redis is required - emails are processed immediately');
    ; void /* console.log */ ((..._args) => {})('- Check the logs for detailed information about email processing');

  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('❌ Email service test failed:', error);
    logger.error('Email service test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Run the test
testEmailService().then(() => {
  ; void /* console.log */ ((..._args) => {})('\n✨ Test completed. Check the logs above for results.');
  process.exit(0);
}).catch((error) => {
  ; void /* console.error */ ((..._args) => {})('Test script failed:', error);
  process.exit(1);
});
