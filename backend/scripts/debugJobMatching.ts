#!/usr/bin/env ts-node

/**
 * Debug Job Matching
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Job } from '../src/models/Job';
import { findMatchingUsersForJob } from '../src/utils/jobMatchingService';

async function main() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Get the test job
    const job = await Job.findOne({ title: 'Full Stack Developer - React & Node.js' });
    if (!job) {
      console.log('❌ Test job not found');
      return;
    }
    
    console.log('🔍 Debugging job matching for:');
    console.log(`📋 Job: "${job.title}"`);
    console.log(`🏢 Company: ${job.company}`);
    console.log(`📍 Requirements:`);
    console.log(`   - Qualifications: ${job.eligibility.qualifications}`);
    console.log(`   - Streams: ${job.eligibility.streams}`);
    console.log(`   - Years: ${job.eligibility.passoutYears}`);
    console.log(`   - Min CGPA: ${job.eligibility.minCGPA}`);
    console.log(`   - Max CGPA: ${job.eligibility.maxCGPA}`);
    
    // Get matching users
    console.log('\n🔄 Finding matching users...');
    const matchingUsers = await findMatchingUsersForJob(job._id.toString(), { minMatchScore: 1 });
    
    console.log(`\n📊 Found ${matchingUsers.length} matching users:`);
    
    for (const match of matchingUsers) {
      const user = await User.findById(match.userId);
      const profile = await UserProfile.findOne({ userId: match.userId });
      
      console.log(`\n👤 ${user?.email}:`);
      console.log(`   Match Score: ${match.matchScore}`);
      console.log(`   Subscription: ${user?.subscriptionPlan} (${user?.subscriptionStatus})`);
      console.log(`   Profile Complete: ${user?.isProfileComplete}`);
      
      if (profile) {
        console.log(`   Qualification: ${profile.qualification}`);
        console.log(`   Stream: ${profile.stream}`);
        console.log(`   CGPA: ${profile.cgpaOrPercentage}`);
        console.log(`   Year: ${profile.yearOfPassout}`);
      } else {
        console.log(`   ❌ No profile found`);
      }
      
      console.log(`   Match Reasons: ${match.matchReasons.join(', ')}`);
    }
    
    // Check specific users
    console.log('\n🎯 Checking specific test users:');
    const testEmails = ['saurabhsingh881888@gmail.com', 'xcareerconnect@gmail.com'];
    
    for (const email of testEmails) {
      const user = await User.findOne({ email });
      const profile = await UserProfile.findOne({ userId: user?._id });
      
      console.log(`\n📧 ${email}:`);
      if (user) {
        console.log(`   Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
        console.log(`   Profile Complete: ${user.isProfileComplete}`);
        
        if (profile) {
          console.log(`   Qualification: ${profile.qualification}`);
          console.log(`   Stream: ${profile.stream}`);
          console.log(`   CGPA: ${profile.cgpaOrPercentage}`);
          console.log(`   Year: ${profile.yearOfPassout}`);
          
          // Check if this user would match the job
          const matchesQualification = job.eligibility.qualifications.includes(profile.qualification);
          const matchesStream = job.eligibility.streams.includes(profile.stream);
          const matchesYear = job.eligibility.passoutYears.includes(profile.yearOfPassout);
          const matchesCGPA = profile.cgpaOrPercentage >= (job.eligibility.minCGPA || 0) && 
                            profile.cgpaOrPercentage <= (job.eligibility.maxCGPA || 10);
          
          console.log(`   ✓ Qualification Match: ${matchesQualification}`);
          console.log(`   ✓ Stream Match: ${matchesStream}`);
          console.log(`   ✓ Year Match: ${matchesYear}`);
          console.log(`   ✓ CGPA Match: ${matchesCGPA}`);
          
          const shouldMatch = matchesQualification && matchesStream && matchesYear && matchesCGPA;
          console.log(`   🎯 Should Match: ${shouldMatch}`);
          
        } else {
          console.log(`   ❌ No profile found`);
        }
      } else {
        console.log(`   ❌ User not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
