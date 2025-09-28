#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { emailService } from '../src/utils/emailService';

async function testEmailConfig() {
  console.log('📧 Testing Email Configuration\n');
  
  // Check environment variables
  console.log('⚙️  Email Configuration:');
  console.log(`   HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
  console.log(`   PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
  console.log(`   USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`   PASS: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ EMAIL CREDENTIALS NOT CONFIGURED!');
    console.log('\n🔧 To fix this:');
    console.log('1. Create a .env file in the backend directory');
    console.log('2. Add your email credentials:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-gmail-app-password');
    console.log('3. For Gmail, generate an App Password:');
    console.log('   - Enable 2FA on your Google account');
    console.log('   - Go to Account Settings > Security > App passwords');
    console.log('   - Generate password for "Mail" application');
    return false;
  }
  
  console.log('\n📧 Testing direct email send...');
  
  try {
    // Test sending a simple email
    const result = await emailService.sendEmail({
      to: 'saurabhsingh881888@gmail.com',
      subject: 'Test Email from NotifyX',
      template: 'basic',
      context: {
        text: 'This is a test email to verify email configuration.',
        html: '<h2>Test Email</h2><p>This is a test email to verify your email configuration is working.</p>'
      }
    });
    
    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Check saurabhsingh881888@gmail.com inbox');
      return true;
    } else {
      console.log('❌ Email failed to send');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Email test error:', error);
    return false;
  }
}

async function testJobAlertTemplate() {
  console.log('\n🎯 Testing Job Alert Email Template...');
  
  try {
    const testJobData = {
      title: 'Test Software Engineer Position',
      company: 'Test Company',
      location: 'remote',
      type: 'job',
      description: 'This is a test job to verify email templates are working.',
      applicationLink: 'https://test.com/apply',
      matchPercentage: 95.5,
      matchReasons: [
        '✅ Qualification: B.Tech matches job requirements',
        '✅ Stream: Information Technology matches job requirements',
        '✅ CGPA: 9.2 meets minimum requirement (7.0)'
      ],
      userProfile: {
        name: 'Test User',
        qualification: 'B.Tech',
        stream: 'Information Technology',
        cgpa: 9.2
      }
    };
    
    const result = await emailService.sendJobAlertEmail('xcareerconnect@gmail.com', testJobData);
    
    if (result) {
      console.log('✅ Job alert email sent successfully!');
      console.log('📧 Check xcareerconnect@gmail.com inbox');
      console.log('🎯 Should show 95.5% match with detailed reasons');
      return true;
    } else {
      console.log('❌ Job alert email failed to send');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Job alert template test error:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Simple Email Test\n');
  console.log('====================\n');
  
  // Test email configuration
  const configOK = await testEmailConfig();
  
  if (configOK) {
    // Test job alert template
    await testJobAlertTemplate();
  }
  
  console.log('\n✅ Email test completed');
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
