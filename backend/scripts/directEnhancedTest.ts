#!/usr/bin/env ts-node

/**
 * Direct Enhanced Job Alert Test
 * 
 * Directly tests the enhanced percentage-based system
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { sendJobAlertsEnhanced } from '../src/services/enhancedJobAlertService';

async function main() {
  console.log('🎯 Direct Enhanced Job Alert Test\n');
  
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Use the enhanced test job ID from previous run
    const jobId = '68d8ec3d4219298af1bd6934';
    
    console.log('📧 Sending enhanced job alerts with 50% minimum match...\n');
    
    const result = await sendJobAlertsEnhanced({
      jobId,
      minimumMatchPercentage: 50,
      maxUsers: 10,
      dryRun: false // Send real emails!
    });
    
    console.log('🎉 ENHANCED JOB ALERT RESULTS:');
    console.log('================================');
    console.log(`🎯 Job: "${result.jobTitle}" at ${result.company}`);
    console.log(`👥 Total Eligible Users: ${result.totalEligibleUsers}`);
    console.log(`📧 Emails Sent: ${result.emailsSent}`);
    console.log(`❌ Emails Failed: ${result.emailsFailed}`);
    console.log(`🔄 Duplicates Prevented: ${result.duplicateNotifications}`);
    console.log(`📈 Average Match %: ${result.averageMatchPercentage}%`);
    
    if (result.userMatches.length > 0) {
      console.log('\n📊 USER EMAIL DETAILS:');
      console.log('======================');
      result.userMatches.forEach((match, index) => {
        const status = match.emailSent ? '✅ SENT' : '❌ FAILED';
        console.log(`${index + 1}. ${match.email}`);
        console.log(`   🎯 Match: ${match.matchPercentage}%`);
        console.log(`   📧 Status: ${status}`);
        console.log('');
      });
    }
    
    if (result.emailsSent > 0) {
      console.log('🎉 SUCCESS! Enhanced job alert emails sent with percentage matching!');
      console.log('\n📧 Check these inboxes:');
      console.log('   ✉️  saurabhsingh881888@gmail.com (expected: 91% match)');
      console.log('   ✉️  xcareerconnect@gmail.com (expected: 95.67% match)');
      console.log('\n💡 The emails will show:');
      console.log('   📊 Match percentage in subject line');
      console.log('   🎯 Detailed match reasons');
      console.log('   📋 Personalized content based on user profile');
    } else {
      console.log('⚠️  No emails were sent. This might be due to:');
      console.log('   1. Duplicate notifications (emails already sent)');
      console.log('   2. Email configuration issues');
      console.log('   3. User eligibility filtering');
    }
    
  } catch (error) {
    console.error('\n❌ Direct test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
