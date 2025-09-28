#!/usr/bin/env ts-node

/**
 * Test Enhanced Job Alert System
 * 
 * Tests the new percentage-based job matching with 50% threshold
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { Job } from '../src/models/Job';
import { JobNotification } from '../src/models/JobNotification';
import { sendJobAlertsEnhanced } from '../src/services/enhancedJobAlertService';
import { 
  findEligibleUsersForJobEnhanced, 
  calculateEnhancedMatchPercentage,
  generateMatchReport 
} from '../src/utils/enhancedJobMatching';

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function createEnhancedTestJob() {
  console.log('💼 Creating enhanced test job...\n');
  
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Delete existing test job
    await Job.deleteOne({ title: 'Enhanced Job Alert Test - Full Stack Developer' });
    
    // Create job with specific matching criteria
    const job = new Job({
      title: 'Enhanced Job Alert Test - Full Stack Developer',
      company: 'XCareer Technologies',
      description: 'We are seeking a talented Full Stack Developer to join our innovative team. This position offers great growth opportunities and the chance to work with cutting-edge technologies. Perfect for recent graduates with strong academic background!',
      type: 'job',
      location: 'remote',
      applicationLink: 'https://xcareer.com/apply/enhanced-test-job',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      postedBy: admin._id,
      eligibility: {
        qualifications: ['B.Tech', 'M.Tech'],
        streams: ['Computer Science', 'Information Technology'],
        passoutYears: [2022, 2023, 2024],
        minCGPA: 7.0,
        maxCGPA: 10.0
      },
      salaryRange: {
        min: 800000,
        max: 1500000,
        currency: 'INR'
      },
      requirements: [
        'Strong knowledge of JavaScript/TypeScript',
        'Experience with React and Node.js',
        'Understanding of databases (MongoDB/MySQL)',
        'Good problem-solving skills'
      ],
      responsibilities: [
        'Develop full-stack web applications',
        'Design and implement APIs',
        'Work with modern development tools',
        'Collaborate with cross-functional teams'
      ],
      isActive: true
    });
    
    await job.save();
    console.log(`✅ Created enhanced test job: "${job.title}"`);
    console.log(`🆔 Job ID: ${job._id}`);
    console.log(`🎯 Match Criteria:`);
    console.log(`   - Qualifications: ${job.eligibility.qualifications.join(', ')}`);
    console.log(`   - Streams: ${job.eligibility.streams.join(', ')}`);
    console.log(`   - Years: ${job.eligibility.passoutYears.join(', ')}`);
        console.log(`   - CGPA Range: ${job.eligibility.minCGPA || 'No min'} - ${(job.eligibility as any).maxCGPA || 'No max'}`);
    
    return job;
  } catch (error) {
    console.error('❌ Failed to create enhanced test job:', error);
    throw error;
  }
}

async function testEnhancedMatching(jobId: string) {
  console.log('\n🧪 Testing Enhanced Matching Algorithm...\n');
  
  try {
    // Test with different match percentages
    const testThresholds = [30, 50, 70, 80];
    
    for (const threshold of testThresholds) {
      console.log(`🎯 Testing with ${threshold}% minimum match threshold:`);
      
      const eligibleUsers = await findEligibleUsersForJobEnhanced(jobId, {
        minimumMatchPercentage: threshold,
        maxUsers: 20
      });
      
      console.log(`   📊 Found ${eligibleUsers.length} users with ≥${threshold}% match`);
      
      if (eligibleUsers.length > 0) {
        console.log(`   🏆 Top matches:`);
        eligibleUsers.slice(0, 3).forEach((user, index) => {
          console.log(`     ${index + 1}. ${(user as any).email}: ${user.matchPercentage}%`);
        });
      }
      console.log('');
    }
    
    // Return users for 50% threshold for further processing
    const users50Plus = await findEligibleUsersForJobEnhanced(jobId, {
      minimumMatchPercentage: 50,
      maxUsers: 20
    });
    
    return users50Plus;
  } catch (error) {
    console.error('❌ Enhanced matching test failed:', error);
    throw error;
  }
}

async function sendEnhancedJobAlerts(jobId: string) {
  console.log('📧 Sending Enhanced Job Alerts...\n');
  
  try {
    // Test with 50% minimum match (your requirement)
    console.log('🎯 Sending alerts to users with ≥50% match...');
    
    const result = await sendJobAlertsEnhanced({
      jobId,
      minimumMatchPercentage: 50,
      maxUsers: 20,
      dryRun: false // Send real emails
    });
    
    console.log('\n📊 Enhanced Job Alert Results:');
    console.log(`   🎯 Job: "${result.jobTitle}" at ${result.company}`);
    console.log(`   👥 Total Eligible Users: ${result.totalEligibleUsers}`);
    console.log(`   📧 Emails Sent: ${result.emailsSent}`);
    console.log(`   ❌ Emails Failed: ${result.emailsFailed}`);
    console.log(`   🔄 Duplicate Notifications: ${result.duplicateNotifications}`);
    console.log(`   📈 Average Match Percentage: ${result.averageMatchPercentage}%`);
    
    if (result.userMatches.length > 0) {
      console.log('\n📧 User Email Details:');
      result.userMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.email}: ${match.matchPercentage}% - ${match.emailStatus.toUpperCase()}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced job alerts failed:', error);
    throw error;
  }
}

async function checkSpecificUsers(jobId: string) {
  console.log('\n🎯 Checking Specific Test Users...\n');
  
  const testEmails = ['saurabhsingh881888@gmail.com', 'xcareerconnect@gmail.com'];
  
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    for (const email of testEmails) {
      console.log(`👤 Analyzing ${email}:`);
      
      const user = await User.findOne({ email }).populate('profile');
      if (!user) {
        console.log(`   ❌ User not found in database`);
        continue;
      }
      
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   💳 Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
      console.log(`   ✅ Profile Complete: ${user.isProfileComplete}`);
      
      // Find user profile separately since populate might not work
      const profile = await mongoose.model('UserProfile').findOne({ userId: user._id });
      
      if (profile) {
        console.log(`   🎓 Qualification: ${profile.qualification}`);
        console.log(`   📚 Stream: ${profile.stream}`);
        console.log(`   📈 CGPA: ${profile.cgpaOrPercentage}`);
        console.log(`   📅 Year: ${profile.yearOfPassout}`);
        
        // Calculate match percentage
        const matchResult = calculateEnhancedMatchPercentage(profile, job.eligibility);
        
        console.log(`   🎯 Match Percentage: ${matchResult.matchPercentage}%`);
        console.log(`   ✅ Eligible for Alerts: ${matchResult.eligible ? 'YES' : 'NO'}`);
        
        if (matchResult.matchReasons.length > 0) {
          console.log(`   💡 Match Reasons:`);
          matchResult.matchReasons.slice(0, 3).forEach((reason, index) => {
            console.log(`     ${index + 1}. ${reason}`);
          });
        }
        
        // Generate detailed report
        const detailReport = generateMatchReport(profile, job.eligibility);
        console.log(`\n📋 DETAILED MATCH REPORT for ${email}:`);
        console.log(detailReport);
        
      } else {
        console.log(`   ❌ No profile found`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Failed to check specific users:', error);
  }
}

async function main() {
  console.log('🚀 Enhanced Job Alert System Test\n');
  console.log('==================================\n');
  
  try {
    await connectDatabase();
    
    // Create enhanced test job
    const job = await createEnhancedTestJob();
    
    // Test enhanced matching algorithm
    await testEnhancedMatching(job._id.toString());
    
    // Check specific test users
    await checkSpecificUsers(job._id.toString());
    
    // Send enhanced job alerts
    await sendEnhancedJobAlerts(job._id.toString());
    
    console.log('\n🎉 Enhanced job alert test completed successfully!');
    console.log('\n📧 Email Addresses to Check:');
    console.log('   ✉️  saurabhsingh881888@gmail.com');
    console.log('   ✉️  xcareerconnect@gmail.com');
    console.log('   ✉️  john.doe@example.com');
    console.log('   ✉️  alex.brown@example.com');
    console.log('\n💡 Enhanced Features:');
    console.log('   📊 Percentage-based matching (≥50% threshold)');
    console.log('   🎯 Detailed match reasons in emails');
    console.log('   📈 Match score displayed in subject line');
    console.log('   🔍 Comprehensive eligibility analysis');
    
  } catch (error) {
    console.error('\n❌ Enhanced test failed:', error);
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
