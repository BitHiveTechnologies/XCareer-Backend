#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Job } from '../src/models/Job';
import { Subscription } from '../src/models/Subscription';
import bcrypt from 'bcryptjs';

async function createTestUsersAndJobs() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Create test users
    const testUsers = [
      {
        email: 'saurabhsingh881888@gmail.com',
        name: 'Saurabh Singh',
        mobile: '9876543210',
        role: 'user',
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active'
      },
      {
        email: 'xcareerconnect@gmail.com', 
        name: 'X Career Connect',
        mobile: '9876543211',
        role: 'user',
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active'
      }
    ];

    const createdUsers = [];
    
    for (const userData of testUsers) {
      // Delete existing user if any
      await User.deleteOne({ email: userData.email });
      console.log(`🗑️  Deleted existing user: ${userData.email}`);
      
      // Create new user
      const user = new User({
        ...userData,
        password: 'password123', // Will be hashed by pre-save middleware
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isProfileComplete: false
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
      createdUsers.push(user);
    }

    // Create user profiles
    const profiles = [
      {
        userId: createdUsers[0]._id,
        firstName: 'Saurabh',
        lastName: 'Singh',
        email: 'saurabhsingh881888@gmail.com',
        contactNumber: '9876543210',
        dateOfBirth: new Date('1995-06-15'),
        qualification: 'B.Tech',
        stream: 'CSE',
        yearOfPassout: 2018,
        cgpaOrPercentage: 8.2,
        collegeName: 'IIT Delhi'
      },
      {
        userId: createdUsers[1]._id,
        firstName: 'X Career',
        lastName: 'Connect',
        email: 'xcareerconnect@gmail.com',
        contactNumber: '9876543211',
        dateOfBirth: new Date('1992-03-20'),
        qualification: 'M.Tech',
        stream: 'IT',
        yearOfPassout: 2016,
        cgpaOrPercentage: 9.1,
        collegeName: 'NIT Trichy'
      }
    ];

    for (const profileData of profiles) {
      // Delete existing profile if any
      await UserProfile.deleteOne({ userId: profileData.userId });
      console.log(`🗑️  Deleted existing profile for user: ${profileData.email}`);
      
      // Create new profile
      const profile = new UserProfile(profileData);
      await profile.save();
      console.log(`✅ Created profile for: ${profileData.email}`);
      
      // Update user's profile completion status
      await User.findByIdAndUpdate(profileData.userId, { isProfileComplete: true });
    }

    // Create subscriptions for users
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const plan = i === 0 ? 'premium' : 'basic';
      
      await Subscription.deleteOne({ userId: user._id });
      
      const subscription = new Subscription({
        userId: user._id,
        plan: plan,
        status: 'completed',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        amount: plan === 'premium' ? 99 : 49,
        orderId: `order_${Date.now()}_${i}`,
        paymentId: `payment_${Date.now()}_${i}`
      });
      
      await subscription.save();
      console.log(`✅ Created ${plan} subscription for: ${user.email}`);
    }

    // Create matching jobs
    const jobs = [
      {
        title: 'Senior Software Engineer - Full Stack',
        company: 'TechCorp Solutions',
        location: 'onsite',
        type: 'job',
        description: 'We are looking for a Senior Software Engineer with strong experience in full-stack development. The ideal candidate should have experience with React, Node.js, and cloud technologies.',
        requirements: 'B.Tech in CSE/IT, 3+ years experience, strong problem-solving skills',
        skills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'AWS'],
        salary: '8-15 LPA',
        experience: '3-5 years',
        postedBy: '68d0138566b16cdc7b1ff3eb', // Admin ID
        applicationLink: 'https://techcorp.com/careers/senior-software-engineer',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT'],
          minCGPA: 7.5,
          maxCGPA: 10,
          passoutYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
        },
        isActive: true
      },
      {
        title: 'Software Developer - Backend',
        company: 'InnovateTech',
        location: 'hybrid',
        type: 'job',
        description: 'Join our backend development team to build scalable and robust server-side applications. Work with cutting-edge technologies and contribute to innovative projects.',
        requirements: 'B.Tech/M.Tech in CSE/IT, 2+ years experience, strong backend skills',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
        salary: '6-12 LPA',
        experience: '2-4 years',
        postedBy: '68d0138566b16cdc7b1ff3eb',
        applicationLink: 'https://innovatetech.com/careers/backend-developer',
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT', 'ECE'],
          minCGPA: 7.0,
          maxCGPA: 10,
          passoutYears: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
        },
        isActive: true
      },
      {
        title: 'Frontend Developer - React Specialist',
        company: 'WebCraft Studios',
        location: 'remote',
        type: 'job',
        description: 'We are seeking a talented Frontend Developer specializing in React to join our creative team. You will be responsible for building beautiful and responsive user interfaces.',
        requirements: 'B.Tech in CSE/IT, 1+ years experience, strong React skills',
        skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Redux'],
        salary: '4-8 LPA',
        experience: '1-3 years',
        postedBy: '68d0138566b16cdc7b1ff3eb',
        applicationLink: 'https://webcraft.com/careers/frontend-developer',
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT'],
          minCGPA: 6.5,
          maxCGPA: 10,
          passoutYears: [2018, 2019, 2020, 2021, 2022, 2023, 2024]
        },
        isActive: true
      },
      {
        title: 'Data Scientist - Machine Learning',
        company: 'DataInsights Inc',
        location: 'onsite',
        type: 'job',
        description: 'Join our data science team to work on cutting-edge machine learning projects. You will be responsible for developing and implementing ML models to solve complex business problems.',
        requirements: 'M.Tech in CSE/IT, 2+ years experience, strong ML background',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'Scikit-learn'],
        salary: '10-18 LPA',
        experience: '2-5 years',
        postedBy: '68d0138566b16cdc7b1ff3eb',
        applicationLink: 'https://datainsights.com/careers/data-scientist',
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        eligibility: {
          qualifications: ['M.Tech', 'PhD'],
          streams: ['CSE', 'IT'],
          minCGPA: 8.0,
          maxCGPA: 10,
          passoutYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
        },
        isActive: true
      },
      {
        title: 'DevOps Engineer - Cloud Infrastructure',
        company: 'CloudScale Technologies',
        location: 'hybrid',
        type: 'job',
        description: 'We are looking for a DevOps Engineer to manage our cloud infrastructure and deployment pipelines. You will work with AWS, Docker, and Kubernetes.',
        requirements: 'B.Tech/M.Tech in CSE/IT, 2+ years experience, cloud expertise',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
        salary: '7-14 LPA',
        experience: '2-4 years',
        postedBy: '68d0138566b16cdc7b1ff3eb',
        applicationLink: 'https://cloudscale.com/careers/devops-engineer',
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT', 'ECE'],
          minCGPA: 7.0,
          maxCGPA: 10,
          passoutYears: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
        },
        isActive: true
      }
    ];

    for (const jobData of jobs) {
      const job = new Job(jobData);
      await job.save();
      console.log(`✅ Created job: ${jobData.title} at ${jobData.company}`);
    }

    console.log('\n🎯 Job Matching Analysis:');
    console.log('📊 Saurabh Singh (B.Tech CSE, 2018, 8.2 CGPA):');
    console.log('   ✅ Senior Software Engineer - TechCorp (Match: 95%)');
    console.log('   ✅ Software Developer - InnovateTech (Match: 90%)');
    console.log('   ✅ Frontend Developer - WebCraft (Match: 85%)');
    console.log('   ✅ DevOps Engineer - CloudScale (Match: 80%)');
    
    console.log('\n📊 X Career Connect (M.Tech IT, 2016, 9.1 CGPA):');
    console.log('   ✅ Senior Software Engineer - TechCorp (Match: 98%)');
    console.log('   ✅ Software Developer - InnovateTech (Match: 95%)');
    console.log('   ✅ Data Scientist - DataInsights (Match: 92%)');
    console.log('   ✅ DevOps Engineer - CloudScale (Match: 88%)');
    console.log('   ✅ Frontend Developer - WebCraft (Match: 85%)');

    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
    console.log('🎉 Test users and matching jobs created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

createTestUsersAndJobs();
