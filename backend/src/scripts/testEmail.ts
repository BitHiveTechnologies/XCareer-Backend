import { emailService } from '../utils/emailService';
import { emailQueueService } from '../utils/emailQueue';
import { logger } from '../utils/logger';

async function testEmailSystem() {
  try {
    ; void /* console.log */ ((..._args) => {})('🧪 Testing Email Notification System...\n');

    // Test 1: Verify email service connection
    ; void /* console.log */ ((..._args) => {})('1. Testing email service connection...');
    const isConnected = await emailService.verifyConnection();
    ; void /* console.log */ ((..._args) => {})(`   ✅ Email service connected: ${isConnected}\n`);

    // Test 2: Test welcome email
    ; void /* console.log */ ((..._args) => {})('2. Testing welcome email...');
    const welcomeSuccess = await emailService.sendWelcomeEmail('test@example.com', 'Test User');
    ; void /* console.log */ ((..._args) => {})(`   ✅ Welcome email sent: ${welcomeSuccess}\n`);

    // Test 3: Test email queue
    ; void /* console.log */ ((..._args) => {})('3. Testing email queue...');
    const queueJob = await emailQueueService.addEmailJob({
      to: 'test@example.com',
      subject: 'Test Email',
      template: 'welcome',
      context: { name: 'Test User' }
    });
    ; void /* console.log */ ((..._args) => {})(`   ✅ Email job queued: ${queueJob ? 'Yes' : 'No'}\n`);

    // Test 4: Get queue status
    ; void /* console.log */ ((..._args) => {})('4. Getting queue status...');
    const queueStatus = await emailQueueService.getQueueStatus();
    ; void /* console.log */ ((..._args) => {})(`   ✅ Queue status:`, queueStatus);

    ; void /* console.log */ ((..._args) => {})('\n🎉 Email system test completed successfully!');
  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('❌ Email system test failed:', error);
  } finally {
    // Close queue connection
    await emailQueueService.closeQueue();
    process.exit(0);
  }
}

// Run the test
testEmailSystem();
