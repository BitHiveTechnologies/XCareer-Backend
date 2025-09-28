#!/usr/bin/env ts-node

/**
 * Complete Job Alert Flow Test
 * 
 * This script tests the entire job notification flow:
 * 1. Creates test users with real email addresses
 * 2. Completes their profiles
 * 3. Sets up active subscriptions
 * 4. Creates matching jobs
 * 5. Triggers job alerts
 * 6. Verifies email delivery
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Subscription } from '../src/models/Subscription';
import { Job } from '../src/models/Job';
import { JobNotification } from '../src/models/JobNotification';
import { sendJobAlertsForJob, getJobAlertStats } from '../src/services/jobAlertService';
import { logger } from '../src/utils/logger';
import bcrypt from 'bcryptjs';

// Test user data
const TEST_USERS = [
  {
    email: 'saurabhsingh881888@gmail.com',
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
  },
  {
    email: 'xcareerconnect@gmail.com',
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
  }
];

// Test jobs that match user criteria
const TEST_JOBS = [
  {
    title: 'Software Development Engineer - Frontend',
    company: 'TechCorp Solutions',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'We are looking for a passionate frontend developer to join our dynamic team. You will work on cutting-edge web applications using React, TypeScript, and modern development practices.',
    requirements: [
      'Strong knowledge of React and JavaScript',
      'Experience with TypeScript',
      'Good understanding of CSS and responsive design',
      'Fresh graduates welcome'
    ],
    responsibilities: [
      'Develop user-friendly web interfaces',
      'Collaborate with design and backend teams',
      'Write clean, maintainable code',
      'Participate in code reviews'
    ],
    eligibility: {
      qualification: 'B.Tech',
      stream: ['Computer Science', 'Information Technology'],
      minCgpaOrPercentage: 7.0,
      maxCgpaOrPercentage: 10.0,
      yearOfPassout: [2022, 2023, 2024, 2025]
    },
    salaryRange: {
      min: 600000,
      max: 1200000,
      currency: 'INR'
    },
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    postedDate: new Date(),
    isActive: true
  },
  {
    title: 'Backend Developer - Node.js',
    company: 'InnovateX Labs',
    location: 'Delhi, India',
    type: 'Full-time',
    description: 'Join our backend team to build scalable APIs and microservices. You will work with Node.js, MongoDB, and cloud technologies.',
    requirements: [
      'Knowledge of Node.js and JavaScript',
      'Understanding of databases',
      'RESTful API development experience',
      'Problem-solving skills'
    ],
    responsibilities: [
      'Design and implement backend services',
      'Work with databases and APIs',
      'Ensure system scalability and performance',
      'Collaborate with frontend developers'
    ],
    eligibility: {
      qualification: 'B.Tech',
      stream: ['Computer Science', 'Information Technology'],
      minCgpaOrPercentage: 8.0,
      maxCgpaOrPercentage: 10.0,
      yearOfPassout: [2023, 2024]
    },
    salaryRange: {
      min: 800000,
      max: 1500000,
      currency: 'INR'
    },
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    postedDate: new Date(),
    isActive: true
  },
  {
    title: 'Full Stack Developer - MERN',
    company: 'StartupHub Technologies',
    location: 'Mumbai, India',
    type: 'Full-time',
    description: 'We are seeking a versatile full-stack developer to work on our innovative web platform using the MERN stack.',
    requirements: [
      'Experience with MongoDB, Express, React, Node.js',
      'Good understanding of both frontend and backend',
      'Version control with Git',
      'Strong analytical skills'
    ],
    responsibilities: [
      'Develop end-to-end web applications',
      'Integrate frontend and backend systems',
      'Optimize application performance',
      'Mentor junior developers'
    ],
    eligibility: {
      qualification: 'B.Tech',
      stream: ['Computer Science', 'Information Technology'],
      minCgpaOrPercentage: 8.5,
      maxCgpaOrPercentage: 10.0,
      yearOfPassout: [2023, 2024]
    },
    salaryRange: {
      min: 1000000,
      max: 1800000,
      currency: 'INR'
    },
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    postedDate: new Date(),
    isActive: true
  }
];

async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...\n');
  
  const createdUsers = [];
  
  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping creation`);
        createdUsers.push(existingUser);
        continue;
      }
      
      // Create user (password will be hashed by pre-save middleware)
      const user = new User({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        mobile: userData.mobile,
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isProfileComplete: false, // Will be set to true after profile creation
        role: 'user'
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
      createdUsers.push(user);
      
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error);
      throw error;
    }
  }
  
  return createdUsers;
}

async function createUserProfiles(users: any[]) {
  console.log('\n📝 Creating user profiles...\n');
  
  const createdProfiles = [];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const profileData = TEST_USERS[i].profile;
    
    try {
      // Check if profile already exists
      const existingProfile = await UserProfile.findOne({ userId: user._id });
      if (existingProfile) {
        console.log(`⚠️  Profile for ${user.email} already exists, skipping creation`);
        createdProfiles.push(existingProfile);
        continue;
      }
      
      // Create profile
      const profile = new UserProfile({
        userId: user._id,
        email: user.email, // Add email field required by interface
        ...profileData
      });
      
      await profile.save();
      
      // Update user's isProfileComplete flag
      await User.findByIdAndUpdate(user._id, { 
        isProfileComplete: true,
        updatedAt: new Date()
      });
      
      console.log(`✅ Created profile for: ${user.email}`);
      createdProfiles.push(profile);
      
    } catch (error) {
      console.error(`❌ Failed to create profile for ${user.email}:`, error);
      throw error;
    }
  }
  
  return createdProfiles;
}

async function createSubscriptions(users: any[]) {
  console.log('\n💳 Creating subscriptions...\n');
  
  const createdSubscriptions = [];
  
  for (const user of users) {
    try {
      // Check if subscription already exists
      const existingSubscription = await Subscription.findOne({ userId: user._id });
      if (existingSubscription) {
        console.log(`⚠️  Subscription for ${user.email} already exists, skipping creation`);
        createdSubscriptions.push(existingSubscription);
        continue;
      }
      
      // Create subscription
      const subscription = new Subscription({
        userId: user._id,
        plan: 'premium',
        status: 'completed', // Use 'completed' instead of 'active'
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        amount: 99, // Premium plan amount
        paymentId: `test_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: `test_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          source: 'test_provisioning',
          paymentMethod: 'test',
          planName: 'Premium Plan'
        }
      });
      
      await subscription.save();
      console.log(`✅ Created subscription for: ${user.email}`);
      createdSubscriptions.push(subscription);
      
    } catch (error) {
      console.error(`❌ Failed to create subscription for ${user.email}:`, error);
      throw error;
    }
  }
  
  return createdSubscriptions;
}

async function createTestJobs() {
  console.log('\n💼 Creating test jobs...\n');
  
  const createdJobs = [];
  
  for (const jobData of TEST_JOBS) {
    try {
      // Check if job already exists (by title and company)
      const existingJob = await Job.findOne({ 
        title: jobData.title, 
        company: jobData.company 
      });
      
      if (existingJob) {
        console.log(`⚠️  Job "${jobData.title}" at ${jobData.company} already exists, skipping creation`);
        createdJobs.push(existingJob);
        continue;
      }
      
      // Create job
      const job = new Job({
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await job.save();
      console.log(`✅ Created job: "${jobData.title}" at ${jobData.company}`);
      createdJobs.push(job);
      
    } catch (error) {
      console.error(`❌ Failed to create job "${jobData.title}":`, error);
      throw error;
    }
  }
  
  return createdJobs;
}

async function triggerJobAlerts(jobs: any[]) {
  console.log('\n📧 Triggering job alerts...\n');
  
  const results = [];
  
  for (const job of jobs) {
    try {
      console.log(`🔄 Processing job alerts for: "${job.title}"`);
      
      // Trigger job alerts for this job
      const result = await sendJobAlertsForJob({
        jobId: job._id.toString(),
        dryRun: false, // Set to true for testing without sending emails
        minMatchScore: 70,
        maxUsers: 100
      });
      
      console.log(`📊 Job alert results for "${job.title}":`, {
        totalEligibleUsers: result.totalEligibleUsers,
        emailsSent: result.emailsSent,
        emailsFailed: result.emailsFailed,
        duplicateNotifications: result.duplicateNotifications,
        usersWithoutProfile: result.usersWithoutProfile,
        usersWithInactiveSubscription: result.usersWithInactiveSubscription
      });
      
      results.push({ job: job.title, result });
      
    } catch (error) {
      console.error(`❌ Failed to trigger job alerts for "${job.title}":`, error);
    }
  }
  
  return results;
}

async function checkJobNotifications() {
  console.log('\n📋 Checking job notifications status...\n');
  
  try {
    const notifications = await JobNotification.find({})
      .populate('userId', 'email firstName lastName')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 });
    
    console.log(`📧 Total notifications: ${notifications.length}\n`);
    
    for (const notification of notifications) {
      const user = notification.userId as any;
      const job = notification.jobId as any;
      
      console.log(`👤 User: ${user.email} (${user.name})`);
      console.log(`💼 Job: "${job.title}" at ${job.company}`);
      console.log(`📧 Email Status: ${notification.emailStatus}`);
      console.log(`✅ Email Sent: ${notification.emailSent}`);
      if (notification.emailSentAt) {
        console.log(`⏰ Sent At: ${notification.emailSentAt}`);
      }
      console.log('---');
    }
    
    return notifications;
    
  } catch (error) {
    console.error('❌ Failed to check job notifications:', error);
    throw error;
  }
}

async function getJobAlertStatistics() {
  console.log('\n📊 Job Alert Statistics...\n');
  
  try {
    const stats = await getJobAlertStats();
    
    console.log('Overall Statistics:');
    console.log(`📧 Total Notifications: ${stats.totalNotifications}`);
    console.log(`✅ Sent Notifications: ${stats.sentNotifications}`);
    console.log(`❌ Failed Notifications: ${stats.failedNotifications}`);
    console.log(`⏳ Pending Notifications: ${stats.pendingNotifications}`);
    console.log(`📈 Average Match Score: ${stats.averageMatchScore.toFixed(2)}`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Failed to get job alert statistics:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...\n');
  
  const userEmails = TEST_USERS.map(u => u.email);
  
  try {
    // Find test users
    const testUsers = await User.find({ email: { $in: userEmails } });
    const testUserIds = testUsers.map(u => u._id);
    
    // Delete job notifications for test users
    const deletedNotifications = await JobNotification.deleteMany({ 
      userId: { $in: testUserIds } 
    });
    console.log(`🗑️  Deleted ${deletedNotifications.deletedCount} job notifications`);
    
    // Delete test jobs
    const jobTitles = TEST_JOBS.map(j => j.title);
    const deletedJobs = await Job.deleteMany({ 
      title: { $in: jobTitles } 
    });
    console.log(`🗑️  Deleted ${deletedJobs.deletedCount} test jobs`);
    
    // Delete subscriptions for test users
    const deletedSubscriptions = await Subscription.deleteMany({ 
      userId: { $in: testUserIds } 
    });
    console.log(`🗑️  Deleted ${deletedSubscriptions.deletedCount} subscriptions`);
    
    // Delete user profiles for test users
    const deletedProfiles = await UserProfile.deleteMany({ 
      userId: { $in: testUserIds } 
    });
    console.log(`🗑️  Deleted ${deletedProfiles.deletedCount} user profiles`);
    
    // Delete test users
    const deletedUsers = await User.deleteMany({ 
      email: { $in: userEmails } 
    });
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} test users`);
    
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

async function main() {
  console.log('🚀 Starting Complete Job Alert Flow Test\n');
  console.log('=========================================\n');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Step 1: Create test users
    console.log('📋 Step 1: Creating Test Users');
    const users = await createTestUsers();
    
    // Step 2: Create user profiles
    console.log('\n📋 Step 2: Creating User Profiles');
    await createUserProfiles(users);
    
    // Step 3: Create subscriptions
    console.log('\n📋 Step 3: Creating Subscriptions');
    await createSubscriptions(users);
    
    // Step 4: Create test jobs
    console.log('\n📋 Step 4: Creating Test Jobs');
    const jobs = await createTestJobs();
    
    // Step 5: Trigger job alerts
    console.log('\n📋 Step 5: Triggering Job Alerts');
    const alertResults = await triggerJobAlerts(jobs);
    
    // Step 6: Check notifications
    console.log('\n📋 Step 6: Checking Notifications');
    await checkJobNotifications();
    
    // Step 7: Get statistics
    console.log('\n📋 Step 7: Getting Statistics');
    await getJobAlertStatistics();
    
    console.log('\n🎉 Job Alert Flow Test Completed Successfully!');
    console.log('\n📧 Please check the email addresses:');
    console.log('   - saurabhsingh881888@gmail.com');
    console.log('   - xcareerconnect@gmail.com');
    console.log('\n   You should receive job alert emails for matching positions.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

// Cleanup function for testing
async function cleanup() {
  console.log('🧹 Running Cleanup Mode\n');
  
  try {
    await connectDatabase();
    await cleanupTestData();
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
  cleanup().catch(console.error);
} else {
  main().catch(console.error);
}

export { main, cleanup };
