#!/usr/bin/env ts-node

/**
 * Setup Specific Test Users
 * 
 * Creates users for saurabhsingh881888@gmail.com and xcareerconnect@gmail.com
 * with proper profiles and subscriptions
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { sendJobAlertsForJob } from '../src/services/jobAlertService';

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function setupUser(email: string, userData: any) {
  console.log(`👤 Setting up user: ${email}`);
  
  try {
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        password: userData.password,
        name: userData.name,
        mobile: userData.mobile,
        role: 'user',
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isProfileComplete: false
      });
      await user.save();
      console.log(`✅ Created user: ${email}`);
    } else {
      // Update existing user to ensure they meet requirements
      user.subscriptionStatus = 'active';
      user.subscriptionPlan = 'premium';
      user.subscriptionStartDate = new Date();
      user.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await user.save();
      console.log(`✅ Updated user: ${email}`);
    }
    
    // Find or create profile
    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = new UserProfile({
        userId: user._id,
        email: user.email,
        firstName: userData.profile.firstName,
        lastName: userData.profile.lastName,
        contactNumber: userData.profile.contactNumber,
        dateOfBirth: userData.profile.dateOfBirth,
        qualification: userData.profile.qualification,
        stream: userData.profile.stream,
        yearOfPassout: userData.profile.yearOfPassout,
        cgpaOrPercentage: userData.profile.cgpaOrPercentage,
        collegeName: userData.profile.collegeName
      });
      await profile.save();
      console.log(`✅ Created profile for: ${email}`);
    } else {
      // Update existing profile
      Object.assign(profile, {
        firstName: userData.profile.firstName,
        lastName: userData.profile.lastName,
        contactNumber: userData.profile.contactNumber,
        dateOfBirth: userData.profile.dateOfBirth,
        qualification: userData.profile.qualification,
        stream: userData.profile.stream,
        yearOfPassout: userData.profile.yearOfPassout,
        cgpaOrPercentage: userData.profile.cgpaOrPercentage,
        collegeName: userData.profile.collegeName
      });
      await profile.save();
      console.log(`✅ Updated profile for: ${email}`);
    }
    
    // Mark profile as complete
    user.isProfileComplete = true;
    await user.save();
    
    return { user, profile };
    
  } catch (error) {
    console.error(`❌ Failed to setup user ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🎯 Setting Up Specific Test Users\n');
  console.log('==================================\n');
  
  try {
    await connectDatabase();
    
    // Setup first user
    await setupUser('saurabhsingh881888@gmail.com', {
      password: 'TestUser123!',
      name: 'Saurabh Singh',
      mobile: '9999999001',
      profile: {
        firstName: 'Saurabh',
        lastName: 'Singh',
        contactNumber: '9999999001',
        dateOfBirth: new Date('1999-05-15'),
        qualification: 'B.Tech',
        stream: 'Computer Science',
        yearOfPassout: 2023,
        cgpaOrPercentage: 8.5,
        collegeName: 'IIT Delhi'
      }
    });
    
    // Setup second user
    await setupUser('xcareerconnect@gmail.com', {
      password: 'TestUser456!',
      name: 'Priya Sharma', 
      mobile: '9999999002',
      profile: {
        firstName: 'Priya',
        lastName: 'Sharma',
        contactNumber: '9999999002',
        dateOfBirth: new Date('2000-08-22'),
        qualification: 'B.Tech',
        stream: 'Information Technology',
        yearOfPassout: 2024,
        cgpaOrPercentage: 9.2,
        collegeName: 'BITS Pilani'
      }
    });
    
    console.log('\n✅ Both users are now set up with:');
    console.log('   - Active premium subscriptions');
    console.log('   - Complete profiles');
    console.log('   - Eligible for job alerts');
    
    // Find the latest test job
    const testJob = await mongoose.model('Job').findOne({ 
      title: 'Test Job Alert - Software Engineer' 
    }).sort({ createdAt: -1 });
    
    if (testJob) {
      console.log('\n📧 Triggering job alerts for existing test job...');
      const result = await sendJobAlertsForJob({
        jobId: testJob._id.toString(),
        dryRun: false,
        minMatchScore: 40,
        maxUsers: 10
      });
      
      console.log('📊 Results:', result);
    }
    
    console.log('\n🎉 Setup completed! Both email addresses should now receive job alerts.');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
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
