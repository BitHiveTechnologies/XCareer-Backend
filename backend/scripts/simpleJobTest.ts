#!/usr/bin/env ts-node

/**
 * Simple Job Alert Test - Works with existing data
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { Job } from '../src/models/Job';
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

async function getAdminUser() {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin user not found');
  }
  return admin;
}

async function createTestJob() {
  console.log('💼 Creating test job...\n');
  
  try {
    const admin = await getAdminUser();
    
    // Delete existing test job
    await Job.deleteOne({ title: 'Test Job Alert - Software Engineer' });
    
    // Create job with correct structure
    const job = new Job({
      title: 'Test Job Alert - Software Engineer',
      company: 'NotifyX Technologies',
      description: 'This is a test job to verify the job alert notification system. If you receive this email, the system is working correctly!',
      type: 'job',
      location: 'remote', // Use lowercase 'remote'
      applicationLink: 'https://notifyx.com/apply/test-job',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      postedBy: admin._id,
      eligibility: {
        qualifications: ['B.Tech', 'M.Tech'], // Array of qualifications
        streams: ['Computer Science', 'Information Technology', 'CSE', 'IT'], // Array of streams
        passoutYears: [2022, 2023, 2024], // Array of years
        minCGPA: 6.0,
        maxCGPA: 10.0
      },
      salaryRange: {
        min: 500000,
        max: 1200000,
        currency: 'INR'
      },
      requirements: ['Basic programming knowledge'],
      responsibilities: ['Test the job alert system'],
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

async function main() {
  console.log('🚀 Simple Job Alert Test\n');
  console.log('=========================\n');
  
  try {
    await connectDatabase();
    
    // Create test job
    const job = await createTestJob();
    
    // Trigger job alerts
    console.log('📧 Triggering job alerts...\n');
    const result = await sendJobAlertsForJob({
      jobId: job._id.toString(),
      dryRun: false, // Send real emails
      minMatchScore: 40, // Lower threshold to catch more matches
      maxUsers: 20
    });
    
    console.log('📊 Job alert results:', result);
    
    // Get statistics
    console.log('\n📈 Getting statistics...\n');
    const stats = await getJobAlertStats();
    console.log('Overall statistics:', stats);
    
    console.log('\n🎉 Job alert test completed!');
    console.log('\n📧 Check these email addresses for notifications:');
    console.log('   - xcareerconnect@gmail.com (if you added this user)');
    console.log('   - john.doe@example.com');
    console.log('   - alex.brown@example.com');
    console.log('   - Other users with active subscriptions and complete profiles');
    
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
