#!/usr/bin/env ts-node

/**
 * Email Setup Test Script
 * 
 * This script tests the email configuration and job alert email functionality.
 * Run this script to verify that your email setup is working correctly.
 * 
 * Usage:
 *   npm run test:email
 *   or
 *   ts-node scripts/testEmailSetup.ts
 */

import { emailService } from '../src/utils/emailService';
import { logger } from '../src/utils/logger';

// Test email configuration
const TEST_EMAIL = 'test@example.com'; // Change this to your email for testing

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');
  
  try {
    // Test 1: Check if email service is initialized
    console.log('1️⃣ Testing Email Service Initialization...');
    
    // Test 2: Test basic email sending
    console.log('2️⃣ Testing Basic Email Sending...');
    const basicEmailResult = await emailService.sendEmail({
      to: TEST_EMAIL,
      subject: 'Test Email from NotifyX Backend',
      template: 'basic',
      context: {
        text: 'This is a test email to verify your email configuration is working correctly.',
        html: '<p>This is a <strong>test email</strong> to verify your email configuration is working correctly.</p>'
      }
    });
    
    if (basicEmailResult) {
      console.log('✅ Basic email sending: SUCCESS');
    } else {
      console.log('❌ Basic email sending: FAILED');
      return false;
    }
    
    // Test 3: Test job alert email with template
    console.log('3️⃣ Testing Job Alert Email Template...');
    const jobAlertResult = await emailService.sendJobAlertEmail(TEST_EMAIL, {
      title: 'Senior Software Engineer',
      company: 'Tech Innovators Ltd',
      location: 'Bangalore, India',
      type: 'Full-time',
      description: 'We are looking for a senior software engineer to join our dynamic team. You will be working on cutting-edge projects using modern technologies.',
      applicationLink: 'https://example.com/apply/12345'
    });
    
    if (jobAlertResult) {
      console.log('✅ Job alert email: SUCCESS');
    } else {
      console.log('❌ Job alert email: FAILED');
      return false;
    }
    
    console.log('\n🎉 All email tests passed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email inbox for the test emails');
    console.log('2. Verify that the job alert email looks professional and contains all job details');
    console.log('3. Update your .env file with your actual email credentials');
    console.log('4. Test with real job data using the job alert API endpoints');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file contains correct EMAIL_USER and EMAIL_PASS');
    console.log('2. For Gmail, ensure you have generated an App Password');
    console.log('3. Verify EMAIL_HOST and EMAIL_PORT are correct for your provider');
    console.log('4. Check server logs for detailed error messages');
    return false;
  }
}

async function testEmailTemplateLoading() {
  console.log('📝 Testing Email Template Loading...\n');
  
  try {
    // This will test if the templates directory is correctly set up
    console.log('Checking if email templates are loaded...');
    
    // The emailService should have loaded templates during initialization
    // If templates are loaded, the sendJobAlertEmail should work
    const result = await emailService.sendJobAlertEmail('test@example.com', {
      title: 'Template Test',
      company: 'Test Company',
      location: 'Test Location',
      type: 'Test Type',
      description: 'This is a template test',
      applicationLink: 'https://example.com'
    });
    
    if (result) {
      console.log('✅ Email templates are loaded correctly');
    } else {
      console.log('❌ Email templates failed to load');
    }
    
  } catch (error) {
    console.log('❌ Template loading error:', error);
    console.log('\n🔧 Template Troubleshooting:');
    console.log('1. Ensure templates exist in src/templates/emails/');
    console.log('2. Run "npm run build" to copy templates to dist/');
    console.log('3. Check that job-alert.hbs exists in dist/templates/emails/');
  }
}

async function showEmailConfiguration() {
  console.log('⚙️  Current Email Configuration:\n');
  
  // Show current email configuration (without sensitive data)
  const config = {
    EMAIL_HOST: process.env.EMAIL_HOST || 'Not configured',
    EMAIL_PORT: process.env.EMAIL_PORT || 'Not configured',
    EMAIL_USER: process.env.EMAIL_USER ? '***@' + process.env.EMAIL_USER.split('@')[1] : 'Not configured',
    EMAIL_PASS: process.env.EMAIL_PASS ? '***********' : 'Not configured',
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'Not configured'
  };
  
  console.table(config);
  console.log();
}

async function main() {
  console.log('📧 NotifyX Email Setup Test\n');
  console.log('=============================\n');
  
  // Show current configuration
  await showEmailConfiguration();
  
  // Test template loading
  await testEmailTemplateLoading();
  
  console.log('\n---\n');
  
  // Test email functionality
  const success = await testEmailConfiguration();
  
  if (success) {
    console.log('\n✅ Email setup is working correctly!');
    process.exit(0);
  } else {
    console.log('\n❌ Email setup needs attention. Please check the troubleshooting steps above.');
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}

export { testEmailConfiguration, testEmailTemplateLoading, showEmailConfiguration };
