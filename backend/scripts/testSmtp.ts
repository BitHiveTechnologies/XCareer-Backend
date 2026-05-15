import { emailService } from '../src/utils/emailService';
import { logger } from '../src/utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSmtp() {
  console.log('--- SMTP TEST START ---');
  console.log(`Using Email: ${process.env.EMAIL_USER}`);
  console.log(`Using Host: ${process.env.EMAIL_HOST}`);

  try {
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      console.error('❌ SMTP Connection Verification Failed!');
      return;
    }
    console.log('✅ SMTP Connection Verified Successfully.');

    const result = await emailService.sendWelcomeEmail(
      'support@xcareers.in', // Sending to self as test
      'Vinod (CareerX Test)',
      'premium',
      'cli_test'
    );

    if (result) {
      console.log('✅ Test Email Sent Successfully to support@xcareers.in');
    } else {
      console.error('❌ Failed to send test email.');
    }
  } catch (error) {
    console.error('❌ Unexpected Error during SMTP test:', error);
  }
}

testSmtp();
