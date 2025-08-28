"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailService_1 = require("../utils/emailService");
const emailQueue_1 = require("../utils/emailQueue");
async function testEmailSystem() {
    try {
        console.log('🧪 Testing Email Notification System...\n');
        // Test 1: Verify email service connection
        console.log('1. Testing email service connection...');
        const isConnected = await emailService_1.emailService.verifyConnection();
        console.log(`   ✅ Email service connected: ${isConnected}\n`);
        // Test 2: Test welcome email
        console.log('2. Testing welcome email...');
        const welcomeSuccess = await emailService_1.emailService.sendWelcomeEmail('test@example.com', 'Test User');
        console.log(`   ✅ Welcome email sent: ${welcomeSuccess}\n`);
        // Test 3: Test email queue
        console.log('3. Testing email queue...');
        const queueJob = await emailQueue_1.emailQueueService.addEmailJob({
            to: 'test@example.com',
            subject: 'Test Email',
            template: 'welcome',
            context: { name: 'Test User' }
        });
        console.log(`   ✅ Email job queued: ${queueJob ? 'Yes' : 'No'}\n`);
        // Test 4: Get queue status
        console.log('4. Getting queue status...');
        const queueStatus = await emailQueue_1.emailQueueService.getQueueStatus();
        console.log(`   ✅ Queue status:`, queueStatus);
        console.log('\n🎉 Email system test completed successfully!');
    }
    catch (error) {
        console.error('❌ Email system test failed:', error);
    }
    finally {
        // Close queue connection
        await emailQueue_1.emailQueueService.closeQueue();
        process.exit(0);
    }
}
// Run the test
testEmailSystem();
//# sourceMappingURL=testEmail.js.map