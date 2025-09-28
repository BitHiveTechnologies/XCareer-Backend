#!/usr/bin/env ts-node

/**
 * Quick Job Alert Test
 * 
 * This script creates a simple test job and triggers alerts using existing users
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Job } from '../src/models/Job';
import { JobNotification } from '../src/models/JobNotification';
import { sendJobAlertsForJob, getJobAlertStats } from '../src/services/jobAlertService';

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function checkExistingUsers() {
  console.log('👥 Checking existing users...\n');
  
  try {
    const users = await User.find({ role: 'user' }).limit(10);
    
    console.log(`📊 Found ${users.length} users in database:`);
    for (const user of users) {
      console.log(`📧 ${user.email} - Plan: ${user.subscriptionPlan}, Status: ${user.subscriptionStatus}, Profile Complete: ${user.isProfileComplete}`);
    }
    
    return users;
  } catch (error) {
    console.error('❌ Failed to check users:', error);
    throw error;
  }
}

async function createSimpleTestJob() {
  console.log('\n💼 Creating simple test job...\n');
  
  try {
    // Delete any existing test job
    await Job.deleteOne({ title: 'Test Software Engineer Position' });
    
    // Create a simple job with broad eligibility
    const job = new Job({
      title: 'Test Software Engineer Position',
      company: 'NotifyX Test Company',
      location: 'Remote',
      type: 'job',
      description: 'This is a test job created to verify the job alert system is working correctly. If you receive this notification, the system is functioning properly.',
      requirements: ['Basic programming knowledge', 'Willingness to learn'],
      responsibilities: ['Test the job alert system'],
      eligibility: {
        qualification: 'B.Tech', // Broad qualification
        stream: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'], // Multiple streams
        minCgpaOrPercentage: 5.0, // Low minimum
        maxCgpaOrPercentage: 10.0, // High maximum
        yearOfPassout: [2020, 2021, 2022, 2023, 2024, 2025] // Wide range
      },
      salaryRange: {
        min: 300000,
        max: 800000,
        currency: 'INR'
      },
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      postedDate: new Date(),
      isActive: true
    });
    
    await job.save();
    console.log(`✅ Created test job: "${job.title}"`);
    console.log(`🆔 Job ID: ${job._id}`);
    
    return job;
  } catch (error) {
    console.error('❌ Failed to create test job:', error);
    throw error;
  }
}

async function triggerJobAlerts(jobId: string) {
  console.log('\n📧 Triggering job alerts...\n');
  
  try {
    // First run in dry mode to see what would happen
    console.log('🧪 Running dry run first...');
    const dryRunResult = await sendJobAlertsForJob({
      jobId,
      dryRun: true,
      minMatchScore: 50,
      maxUsers: 10
    });
    
    console.log('📊 Dry run results:', dryRunResult);
    
    if (dryRunResult.totalEligibleUsers === 0) {
      console.log('⚠️  No eligible users found. Let me check user eligibility...');
      await checkUserEligibility();
      return null;
    }
    
    // Now run for real
    console.log('\n📧 Sending real job alerts...');
    const realResult = await sendJobAlertsForJob({
      jobId,
      dryRun: false,
      minMatchScore: 50,
      maxUsers: 10
    });
    
    console.log('📊 Real run results:', realResult);
    return realResult;
    
  } catch (error) {
    console.error('❌ Failed to trigger job alerts:', error);
    throw error;
  }
}

async function checkUserEligibility() {
  console.log('\n🔍 Checking user eligibility for job alerts...\n');
  
  try {
    // Find users with active subscriptions and complete profiles
    const eligibleUsers = await User.find({
      role: 'user',
      subscriptionStatus: 'active',
      isProfileComplete: true
    });
    
    console.log(`👥 Found ${eligibleUsers.length} potentially eligible users:`);
    
    for (const user of eligibleUsers) {
      console.log(`📧 ${user.email}:`);
      console.log(`   - Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
      console.log(`   - Profile Complete: ${user.isProfileComplete}`);
      
      // Check if user has a profile
      const profile = await UserProfile.findOne({ userId: user._id });
      if (profile) {
        console.log(`   - Qualification: ${profile.qualification}`);
        console.log(`   - Stream: ${profile.stream}`);
        console.log(`   - CGPA: ${profile.cgpaOrPercentage}`);
        console.log(`   - Year of Passout: ${profile.yearOfPassout}`);
      } else {
        console.log(`   - ❌ No profile found`);
      }
      console.log('');
    }
    
    return eligibleUsers;
  } catch (error) {
    console.error('❌ Failed to check user eligibility:', error);
    throw error;
  }
}

async function checkJobNotifications(jobId?: string) {
  console.log('\n📋 Checking job notifications...\n');
  
  try {
    const query = jobId ? { jobId } : {};
    const notifications = await JobNotification.find(query)
      .populate('userId', 'email name')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`📧 Found ${notifications.length} notifications:`);
    
    for (const notification of notifications) {
      const user = notification.userId as any;
      const job = notification.jobId as any;
      
      console.log(`👤 ${user.email} → 💼 "${job.title}"`);
      console.log(`   Status: ${notification.emailStatus}`);
      console.log(`   Sent: ${notification.emailSent}`);
      if (notification.emailSentAt) {
        console.log(`   Sent At: ${notification.emailSentAt}`);
      }
      console.log('');
    }
    
    return notifications;
  } catch (error) {
    console.error('❌ Failed to check notifications:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Quick Job Alert Test\n');
  console.log('=======================\n');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Check existing users
    await checkExistingUsers();
    
    // Check user eligibility
    await checkUserEligibility();
    
    // Create a simple test job
    const testJob = await createSimpleTestJob();
    
    // Trigger job alerts
    await triggerJobAlerts(testJob._id.toString());
    
    // Check notifications
    await checkJobNotifications();
    
    // Get overall statistics
    const stats = await getJobAlertStats();
    console.log('\n📊 Overall Statistics:', stats);
    
    console.log('\n🎉 Quick job alert test completed!');
    console.log('\n📧 Check these email addresses for job alerts:');
    console.log('   - saurabhsingh881888@gmail.com');
    console.log('   - xcareerconnect@gmail.com');
    console.log('   - Any other users with active subscriptions and complete profiles');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
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
