#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { sendJobAlertsEnhanced } from '../src/services/enhancedJobAlertService';
import { Job } from '../src/models/Job';

// Import models to register them with mongoose
import '../src/models/User';
import '../src/models/UserProfile';
import '../src/models/JobNotification';
import '../src/models/Subscription';

async function testJobAlerts() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Get all active jobs
    const jobs = await Job.find({ isActive: true });
    console.log(`📋 Found ${jobs.length} active jobs`);
    
    for (const job of jobs) {
      console.log(`\n🎯 Processing job: ${job.title} at ${job.company}`);
      
      try {
        const result = await sendJobAlertsEnhanced({
          jobId: job._id.toString(),
          minimumMatchPercentage: 50,
          maxUsers: 50,
          dryRun: false
        });
        console.log(`✅ Job alerts sent: ${result.emailsSent} emails sent to ${result.totalEligibleUsers} eligible users`);
        
        if (result.emailsSent > 0) {
          const recipients = result.userMatches
            .filter(match => match.emailSent)
            .map(match => match.email);
          console.log(`📧 Email recipients: ${recipients.join(', ')}`);
        }
      } catch (error) {
        console.error(`❌ Error sending alerts for job ${job.title}:`, error.message);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
    console.log('🎉 Job alert testing completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testJobAlerts();
