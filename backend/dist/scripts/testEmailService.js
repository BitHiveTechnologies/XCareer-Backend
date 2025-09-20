#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailService_1 = require("../utils/emailService");
const emailQueue_1 = require("../utils/emailQueue");
const logger_1 = require("../utils/logger");
async function testEmailService() {
    console.log('🧪 Testing Email Service (No Redis Required)');
    console.log('==========================================\n');
    try {
        // Test 1: Verify email connection
        console.log('1. Testing email connection...');
        const isConnected = await emailService_1.emailService.verifyConnection();
        if (isConnected) {
            console.log('✅ Email service connection successful');
        }
        else {
            console.log('❌ Email service connection failed');
            console.log('   This might be expected if using placeholder credentials');
        }
        // Test 2: Send a test email directly
        console.log('\n2. Testing direct email sending...');
        const testEmail = 'test@example.com';
        const success = await emailService_1.emailService.sendWelcomeEmail(testEmail, 'Test User');
        if (success) {
            console.log('✅ Direct email sending successful');
        }
        else {
            console.log('❌ Direct email sending failed');
        }
        // Test 3: Test email queue service (now processes immediately)
        console.log('\n3. Testing email queue service...');
        const queueJob = await emailQueue_1.emailQueueService.addEmailJob({
            to: testEmail,
            subject: 'Test Email from Queue',
            template: 'test',
            context: {
                html: '<h1>Test Email</h1><p>This is a test email from the simplified queue service.</p>',
                text: 'Test Email - This is a test email from the simplified queue service.'
            }
        });
        if (queueJob && queueJob.status === 'sent') {
            console.log('✅ Email queue service working');
            console.log(`   Job ID: ${queueJob.id}`);
        }
        else {
            console.log('❌ Email queue service failed');
        }
        // Test 4: Get queue statistics
        console.log('\n4. Email queue statistics:');
        const queueStatus = await emailQueue_1.emailQueueService.getQueueStatus();
        console.log(`   Completed: ${queueStatus.completed}`);
        console.log(`   Failed: ${queueStatus.failed}`);
        console.log(`   Waiting: ${queueStatus.waiting}`);
        console.log(`   Active: ${queueStatus.active}`);
        const stats = emailQueue_1.emailQueueService.getStats();
        console.log(`   Success Rate: ${stats.successRate}`);
        console.log('\n🎉 Email service testing completed!');
        console.log('\n📝 Notes:');
        console.log('- If emails failed to send, check your EMAIL_* environment variables');
        console.log('- The service will use Ethereal (test mode) if credentials are not configured');
        console.log('- No Redis is required - emails are processed immediately');
        console.log('- Check the logs for detailed information about email processing');
    }
    catch (error) {
        console.error('❌ Email service test failed:', error);
        logger_1.logger.error('Email service test failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
// Run the test
testEmailService().then(() => {
    console.log('\n✨ Test completed. Check the logs above for results.');
    process.exit(0);
}).catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=testEmailService.js.map