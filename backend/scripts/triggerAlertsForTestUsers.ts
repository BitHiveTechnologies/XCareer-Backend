#!/usr/bin/env ts-node

/**
 * Trigger Job Alerts for Specific Test Users
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { Job } from '../src/models/Job';
import { sendJobAlertsForJob } from '../src/services/jobAlertService';

async function main() {
  console.log('📧 Triggering Job Alerts for Test Users\n');
  console.log('=======================================\n');
  
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found');
    }
    
    // Create a new job specifically for your test users
    await Job.deleteOne({ title: 'Full Stack Developer - React & Node.js' });
    
    const newJob = new Job({
      title: 'Full Stack Developer - React & Node.js',
      company: 'XCareer Technologies',
      description: 'We are looking for a talented Full Stack Developer to join our team. You will work on exciting projects using React, Node.js, and modern web technologies. This is a great opportunity for recent graduates!',
      type: 'job',
      location: 'remote',
      applicationLink: 'https://xcareer.com/apply/full-stack-developer',
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
        min: 600000,
        max: 1500000,
        currency: 'INR'
      },
      requirements: [
        'Strong knowledge of React and Node.js',
        'Experience with MongoDB and Express.js',
        'Good understanding of RESTful APIs',
        'Knowledge of Git and version control'
      ],
      responsibilities: [
        'Develop full-stack web applications',
        'Design and implement RESTful APIs',
        'Work with databases and data modeling',
        'Collaborate with cross-functional teams'
      ],
      isActive: true
    });
    
    await newJob.save();
    console.log(`✅ Created job: "${newJob.title}"`);
    console.log(`🆔 Job ID: ${newJob._id}`);
    
    // Trigger job alerts
    console.log('\n📧 Sending job alerts...\n');
    const result = await sendJobAlertsForJob({
      jobId: newJob._id.toString(),
      dryRun: false,
      minMatchScore: 30, // Lower threshold
      maxUsers: 50
    });
    
    console.log('📊 Job Alert Results:', result);
    
    console.log('\n🎉 Job alerts triggered successfully!');
    console.log('\n📧 Check these email addresses for job notifications:');
    console.log('   ✉️  saurabhsingh881888@gmail.com');
    console.log('   ✉️  xcareerconnect@gmail.com');
    console.log('\n📋 Email Content:');
    console.log('   📧 Subject: New Job Opportunity: Full Stack Developer - React & Node.js');
    console.log('   🏢 Company: XCareer Technologies');
    console.log('   📍 Location: Remote');
    console.log('   💼 Type: Full-time');
    console.log('   🔗 Apply: https://xcareer.com/apply/full-stack-developer');
    
  } catch (error) {
    console.error('\n❌ Failed:', error);
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
