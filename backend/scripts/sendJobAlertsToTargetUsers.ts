#!/usr/bin/env ts-node

/**
 * Send Job Alerts to Target Users
 * 
 * This script sends job alerts directly to your target email addresses
 * with proper percentage matching and enhanced email templates
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Job } from '../src/models/Job';
import { JobNotification } from '../src/models/JobNotification';
import { emailService } from '../src/utils/emailService';
import { calculateEnhancedMatchPercentage } from '../src/utils/enhancedJobMatching';

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function sendJobAlertsToTargetUsers() {
  console.log('🎯 Sending Job Alerts to Target Users\n');
  console.log('=====================================\n');
  
  try {
    // Target email addresses
    const targetEmails = ['saurabhsingh881888@gmail.com', 'xcareerconnect@gmail.com'];
    
    // Get the latest test job
    const job = await Job.findOne({ 
      title: 'Enhanced Job Alert Test - Full Stack Developer' 
    }).sort({ createdAt: -1 });
    
    if (!job) {
      console.log('❌ Test job not found. Creating new job...');
      // Create a new job if needed
      const admin = await User.findOne({ role: 'admin' });
      
      const newJob = new Job({
        title: 'Software Engineer - React & Node.js',
        company: 'XCareer Technologies',
        description: 'We are seeking a talented Software Engineer to join our innovative team. This position offers great growth opportunities for recent graduates with strong academic performance.',
        type: 'job',
        location: 'remote',
        applicationLink: 'https://xcareer.com/careers/software-engineer',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postedBy: admin!._id,
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['Computer Science', 'Information Technology'],
          passoutYears: [2022, 2023, 2024],
          minCGPA: 7.0
        },
        salaryRange: {
          min: 800000,
          max: 1500000,
          currency: 'INR'
        },
        requirements: ['JavaScript/TypeScript', 'React', 'Node.js'],
        responsibilities: ['Develop web applications', 'Design APIs'],
        isActive: true
      });
      
      await newJob.save();
      console.log(`✅ Created new job: ${newJob.title}`);
      return newJob;
    }
    
    console.log(`🎯 Using job: "${job.title}"`);
    console.log(`🏢 Company: ${job.company}`);
    console.log(`🆔 Job ID: ${job._id}\n`);
    
    // Process each target user
    for (const email of targetEmails) {
      console.log(`👤 Processing ${email}:`);
      
      // Find user and profile
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`   ❌ User not found in database`);
        continue;
      }
      
      const profile = await UserProfile.findOne({ userId: user._id });
      if (!profile) {
        console.log(`   ❌ User profile not found`);
        continue;
      }
      
      // Check user eligibility
      if (user.subscriptionStatus !== 'active') {
        console.log(`   ❌ Subscription not active: ${user.subscriptionStatus}`);
        continue;
      }
      
      if (!user.isProfileComplete) {
        console.log(`   ❌ Profile not complete`);
        continue;
      }
      
      console.log(`   ✅ User eligible for job alerts`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   💳 Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
      console.log(`   🎓 Profile: ${profile.qualification} in ${profile.stream}`);
      console.log(`   📈 CGPA: ${profile.cgpaOrPercentage}`);
      console.log(`   📅 Year: ${profile.yearOfPassout}`);
      
      // Calculate match percentage
      const matchResult = calculateEnhancedMatchPercentage(profile, job.eligibility);
      
      console.log(`   🎯 Match Percentage: ${matchResult.matchPercentage}%`);
      console.log(`   ✅ Eligible: ${matchResult.eligible ? 'YES' : 'NO'} (≥50% required)`);
      
      if (matchResult.eligible && matchResult.matchPercentage >= 50) {
        // Check for duplicate notification
        const existingNotification = await JobNotification.findOne({
          userId: user._id,
          jobId: job._id
        });
        
        if (existingNotification) {
          console.log(`   🔄 Notification already sent (${existingNotification.emailStatus})`);
          continue;
        }
        
        // Prepare enhanced job data
        const jobData = {
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          description: job.description,
          applicationLink: job.applicationLink || `https://xcareer.com/jobs/${job._id}/apply`,
          matchPercentage: matchResult.matchPercentage,
          matchReasons: matchResult.matchReasons.filter(reason => reason.includes('✅')).slice(0, 4),
          userProfile: {
            name: user.name,
            qualification: profile.qualification,
            stream: profile.stream,
            cgpa: profile.cgpaOrPercentage
          }
        };
        
        console.log(`   📧 Sending enhanced job alert email...`);
        
        // Send email
        const emailSent = await emailService.sendJobAlertEmail(user.email, jobData);
        
        if (emailSent) {
          // Create notification record
          const notification = new JobNotification({
            userId: user._id,
            jobId: job._id,
            emailStatus: 'sent',
            emailSent: true,
            emailSentAt: new Date()
          });
          
          await notification.save();
          
          console.log(`   ✅ EMAIL SENT SUCCESSFULLY!`);
          console.log(`   📊 Match: ${matchResult.matchPercentage}%`);
          console.log(`   📧 Check ${user.email} inbox`);
          console.log(`   🎯 Subject: "🎯 ${matchResult.matchPercentage}% Match: ${job.title}"`);
          
        } else {
          console.log(`   ❌ Email failed to send`);
        }
        
      } else {
        console.log(`   ❌ Match percentage too low: ${matchResult.matchPercentage}% (need ≥50%)`);
      }
      
      console.log(`\n${'='.repeat(60)}\n`);
    }
    
    console.log('🎉 Job alert sending completed!');
    console.log('\n📧 Check these email addresses:');
    console.log('   ✉️  saurabhsingh881888@gmail.com');
    console.log('   ✉️  xcareerconnect@gmail.com');
    console.log('\n💡 Expected email features:');
    console.log('   📊 Match percentage in subject line');
    console.log('   🎯 Detailed match reasons');
    console.log('   📋 Personalized content');
    console.log('   🎨 Professional enhanced template');
    
  } catch (error) {
    console.error('❌ Failed to send job alerts:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Send Job Alerts to Target Users\n');
  
  try {
    await connectDatabase();
    await sendJobAlertsToTargetUsers();
    
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
