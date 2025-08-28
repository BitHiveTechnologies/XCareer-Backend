import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Admin } from '../src/models/Admin';
import { User } from '../src/models/User';
import { UserProfile } from '../src/models/UserProfile';
import { Job } from '../src/models/Job';
import { JobApplication } from '../src/models/JobApplication';
import { Subscription } from '../src/models/Subscription';
import { JobNotification } from '../src/models/JobNotification';
import { logger } from '../src/utils/logger';

// Sample data for testing
const sampleData = {
  admins: [
    {
      email: 'superadmin@notifyx.com',
      password: 'SuperAdmin123!',
      name: 'Super Administrator',
      role: 'super_admin',
      permissions: [
        'user_management',
        'job_management',
        'subscription_management',
        'admin_management',
        'system_settings',
        'analytics_view',
        'payment_management',
        'email_management'
      ]
    },
    {
      email: 'admin@notifyx.com',
      password: 'Admin123!',
      name: 'System Administrator',
      role: 'admin',
      permissions: [
        'user_management',
        'job_management',
        'subscription_management',
        'analytics_view',
        'email_management'
      ]
    },
    {
      email: 'moderator@notifyx.com',
      password: 'Moderator123!',
      name: 'Content Moderator',
      role: 'admin',
      permissions: [
        'job_management',
        'analytics_view'
      ]
    }
  ],
  users: [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      mobile: '9876543210',
      role: 'user',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date('2024-01-01'),
      subscriptionEndDate: new Date('2024-12-31'),
      isProfileComplete: true
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      mobile: '9876543211',
      role: 'user',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date('2024-01-15'),
      subscriptionEndDate: new Date('2024-07-15'),
      isProfileComplete: true
    },
    {
      email: 'mike.wilson@example.com',
      name: 'Mike Wilson',
      mobile: '9876543212',
      role: 'user',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'inactive',
      isProfileComplete: false
    },
    {
      email: 'sarah.johnson@example.com',
      name: 'Sarah Johnson',
      mobile: '9876543213',
      role: 'user',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'expired',
      subscriptionStartDate: new Date('2023-06-01'),
      subscriptionEndDate: new Date('2023-12-01'),
      isProfileComplete: true
    },
    {
      email: 'alex.brown@example.com',
      name: 'Alex Brown',
      mobile: '9876543214',
      role: 'user',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date('2024-02-01'),
      subscriptionEndDate: new Date('2024-08-01'),
      isProfileComplete: true
    }
  ],
  userProfiles: [
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      dateOfBirth: new Date('1995-03-15'),
      qualification: 'B.Tech',
      stream: 'CSE',
      yearOfPassout: 2023,
      cgpaOrPercentage: 8.5,
      collegeName: 'IIT Delhi',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      experience: '1 year',
      location: 'Mumbai, Maharashtra'
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+919876543211',
      dateOfBirth: new Date('1997-07-22'),
      qualification: 'M.Tech',
      stream: 'IT',
      yearOfPassout: 2024,
      cgpaOrPercentage: 9.2,
      collegeName: 'BITS Pilani',
      skills: ['Python', 'Machine Learning', 'Data Science'],
      experience: 'Fresher',
      location: 'Bangalore, Karnataka'
    },
    {
      firstName: 'Mike',
      lastName: 'Wilson',
      phone: '+919876543212',
      dateOfBirth: new Date('1994-11-08'),
      qualification: 'B.Tech',
      stream: 'ECE',
      yearOfPassout: 2022,
      cgpaOrPercentage: 7.8,
      collegeName: 'NIT Trichy',
      skills: ['Java', 'Spring Boot', 'MySQL'],
      experience: '2 years',
      location: 'Chennai, Tamil Nadu'
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+919876543213',
      dateOfBirth: new Date('1996-04-12'),
      qualification: 'B.Tech',
      stream: 'CSE',
      yearOfPassout: 2021,
      cgpaOrPercentage: 8.9,
      collegeName: 'VIT Vellore',
      skills: ['React', 'TypeScript', 'AWS', 'Docker'],
      experience: '3 years',
      location: 'Hyderabad, Telangana'
    },
    {
      firstName: 'Alex',
      lastName: 'Brown',
      phone: '+919876543214',
      dateOfBirth: new Date('1998-09-30'),
      qualification: 'B.Tech',
      stream: 'IT',
      yearOfPassout: 2024,
      cgpaOrPercentage: 8.1,
      collegeName: 'Manipal Institute of Technology',
      skills: ['Flutter', 'Dart', 'Firebase', 'UI/UX'],
      experience: 'Fresher',
      location: 'Pune, Maharashtra'
    }
  ],
  jobs: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Solutions',
      description: 'We are looking for an experienced software engineer to join our team. The ideal candidate should have strong knowledge of modern web technologies and a passion for building scalable applications.',
      type: 'job',
      eligibility: {
        qualifications: ['B.Tech', 'M.Tech'],
        streams: ['CSE', 'IT'],
        passoutYears: [2020, 2021, 2022, 2023],
        minCGPA: 7.5
      },
      applicationDeadline: new Date('2024-03-15'),
      applicationLink: 'https://techcorp.com/careers/senior-engineer',
      location: 'remote',
      salary: '₹15-25 LPA',
      isActive: true
    },
    {
      title: 'Frontend Developer Intern',
      company: 'StartupXYZ',
      description: 'Join our dynamic startup team as a frontend developer intern. Learn modern frontend technologies and contribute to real-world projects.',
      type: 'internship',
      eligibility: {
        qualifications: ['B.Tech', 'M.Tech'],
        streams: ['CSE', 'IT', 'ECE'],
        passoutYears: [2024, 2025],
        minCGPA: 7.0
      },
      applicationDeadline: new Date('2024-04-30'),
      applicationLink: 'https://startupxyz.com/internships/frontend',
      location: 'hybrid',
      stipend: '₹25,000/month',
      isActive: true
    },
    {
      title: 'Data Scientist',
      company: 'AI Innovations Ltd',
      description: 'Join our AI team to work on cutting-edge machine learning projects. Experience with Python, ML frameworks, and statistical analysis required.',
      type: 'job',
      eligibility: {
        qualifications: ['M.Tech', 'PhD'],
        streams: ['CSE', 'IT', 'Mathematics'],
        passoutYears: [2020, 2021, 2022, 2023, 2024],
        minCGPA: 8.0
      },
      applicationDeadline: new Date('2024-03-31'),
      applicationLink: 'https://aiinnovations.com/careers/data-scientist',
      location: 'onsite',
      salary: '₹20-35 LPA',
      isActive: true
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      description: 'We are seeking a DevOps engineer to help us build and maintain our cloud infrastructure. Experience with AWS, Docker, and CI/CD pipelines required.',
      type: 'job',
      eligibility: {
        qualifications: ['B.Tech', 'M.Tech'],
        streams: ['CSE', 'IT'],
        passoutYears: [2019, 2020, 2021, 2022, 2023],
        minCGPA: 7.0
      },
      applicationDeadline: new Date('2024-04-15'),
      applicationLink: 'https://cloudtech.com/careers/devops',
      location: 'hybrid',
      salary: '₹18-28 LPA',
      isActive: true
    },
    {
      title: 'UI/UX Design Intern',
      company: 'Design Studio Pro',
      description: 'Join our creative team as a UI/UX design intern. Work on real client projects and learn industry-standard design tools.',
      type: 'internship',
      eligibility: {
        qualifications: ['B.Tech', 'B.Des', 'M.Des'],
        streams: ['CSE', 'IT', 'Design'],
        passoutYears: [2024, 2025],
        minCGPA: 7.5
      },
      applicationDeadline: new Date('2024-05-15'),
      applicationLink: 'https://designstudiopro.com/internships/uiux',
      location: 'onsite',
      stipend: '₹30,000/month',
      isActive: true
    }
  ],
  subscriptions: [
    {
      userId: null, // Will be set after user creation
      plan: 'premium',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      amount: 999,
      currency: 'INR',
      paymentMethod: 'razorpay',
      isActive: true
    },
    {
      userId: null, // Will be set after user creation
      plan: 'basic',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      amount: 499,
      currency: 'INR',
      paymentMethod: 'razorpay',
      isActive: true
    },
    {
      userId: null, // Will be set after user creation
      plan: 'premium',
      status: 'expired',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-12-01'),
      amount: 999,
      currency: 'INR',
      paymentMethod: 'razorpay',
      isActive: false
    },
    {
      userId: null, // Will be set after user creation
      plan: 'premium',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-01'),
      amount: 999,
      currency: 'INR',
      paymentMethod: 'razorpay',
      isActive: true
    }
  ],
  jobApplications: [
    {
      userId: null, // Will be set after user creation
      jobId: null, // Will be set after job creation
      status: 'applied',
      coverLetter: 'I am very interested in this position and believe my skills align perfectly with your requirements. I have experience in modern web technologies and am passionate about building scalable applications.',
      resume: 'base64_encoded_resume_content_here',
      appliedAt: new Date('2024-01-20'),
      isActive: true
    },
    {
      userId: null, // Will be set after user creation
      jobId: null, // Will be set after job creation
      status: 'shortlisted',
      coverLetter: 'I am excited about this opportunity to work with your team. My background in machine learning and data science makes me a great fit for this role.',
      resume: 'base64_encoded_resume_content_here',
      appliedAt: new Date('2024-01-25'),
      isActive: true
    },
    {
      userId: null, // Will be set after user creation
      jobId: null, // Will be set after job creation
      status: 'rejected',
      coverLetter: 'I am interested in this position and would like to be considered for the role.',
      resume: 'base64_encoded_resume_content_here',
      appliedAt: new Date('2024-01-18'),
      isActive: false
    }
  ],
  jobNotifications: [
    {
      userId: null, // Will be set after user creation
      jobId: null, // Will be set after job creation
      type: 'new_job',
      title: 'New Job Alert: Senior Software Engineer at TechCorp',
      message: 'A new job matching your profile has been posted. Check it out!',
      isRead: false,
      sentAt: new Date('2024-01-20')
    },
    {
      userId: null, // Will be set after user creation
      jobId: null, // Will be set after job creation
      type: 'application_update',
      title: 'Application Update: Frontend Developer Intern',
      message: 'Your application status has been updated to shortlisted. Congratulations!',
      isRead: true,
      sentAt: new Date('2024-01-25')
    }
  ]
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      User.deleteMany({}),
      UserProfile.deleteMany({}),
      Job.deleteMany({}),
      JobApplication.deleteMany({}),
      Subscription.deleteMany({}),
      JobNotification.deleteMany({})
    ]);
    logger.info('Existing data cleared');

    // Create admins
    logger.info('Creating admin users...');
    const createdAdmins = await Admin.create(sampleData.admins);
    logger.info(`Created ${createdAdmins.length} admin users`);

    // Create users
    logger.info('Creating regular users...');
    const createdUsers = await User.create(sampleData.users);
    logger.info(`Created ${createdUsers.length} regular users`);

    // Create user profiles
    logger.info('Creating user profiles...');
    const userProfiles = [];
    for (let i = 0; i < sampleData.userProfiles.length; i++) {
      const profile = new UserProfile({
        ...sampleData.userProfiles[i],
        userId: createdUsers[i]._id
      });
      userProfiles.push(await profile.save());
    }
    logger.info(`Created ${userProfiles.length} user profiles`);

    // Create jobs (assigning admin as postedBy)
    logger.info('Creating jobs...');
    const createdJobs = [];
    for (let i = 0; i < sampleData.jobs.length; i++) {
      const job = new Job({
        ...sampleData.jobs[i],
        postedBy: createdAdmins[0]._id // Super admin posts all jobs
      });
      createdJobs.push(await job.save());
    }
    logger.info(`Created ${createdJobs.length} jobs`);

    // Create subscriptions (linking to users)
    logger.info('Creating subscriptions...');
    const createdSubscriptions = [];
    for (let i = 0; i < sampleData.subscriptions.length; i++) {
      const subscription = new Subscription({
        ...sampleData.subscriptions[i],
        userId: createdUsers[i]._id
      });
      createdSubscriptions.push(await subscription.save());
    }
    logger.info(`Created ${createdSubscriptions.length} subscriptions`);

    // Create job applications (linking users and jobs)
    logger.info('Creating job applications...');
    const createdApplications = [];
    for (let i = 0; i < sampleData.jobApplications.length; i++) {
      const application = new JobApplication({
        ...sampleData.jobApplications[i],
        userId: createdUsers[i]._id,
        jobId: createdJobs[i]._id
      });
      createdApplications.push(await application.save());
    }
    logger.info(`Created ${createdApplications.length} job applications`);

    // Create job notifications (linking users and jobs)
    logger.info('Creating job notifications...');
    const createdNotifications = [];
    for (let i = 0; i < sampleData.jobNotifications.length; i++) {
      const notification = new JobNotification({
        ...sampleData.jobNotifications[i],
        userId: createdUsers[i]._id,
        jobId: createdJobs[i]._id
      });
      createdNotifications.push(await notification.save());
    }
    logger.info(`Created ${createdNotifications.length} job notifications`);

    // Update user profiles to mark as complete
    logger.info('Updating user profiles...');
    for (let i = 0; i < createdUsers.length; i++) {
      if (i < userProfiles.length) {
        await User.findByIdAndUpdate(createdUsers[i]._id, {
          isProfileComplete: true
        });
      }
    }

    // Update jobs with applications
    logger.info('Updating jobs with applications...');
    for (let i = 0; i < createdJobs.length; i++) {
      if (i < createdApplications.length) {
        await Job.findByIdAndUpdate(createdJobs[i]._id, {
          $push: { applications: createdApplications[i]._id }
        });
      }
    }

    logger.info('Database seeding completed successfully!');
    logger.info('Sample data summary:');
    logger.info(`- Admins: ${createdAdmins.length}`);
    logger.info(`- Users: ${createdUsers.length}`);
    logger.info(`- User Profiles: ${userProfiles.length}`);
    logger.info(`- Jobs: ${createdJobs.length}`);
    logger.info(`- Subscriptions: ${createdSubscriptions.length}`);
    logger.info(`- Job Applications: ${createdApplications.length}`);
    logger.info(`- Job Notifications: ${createdNotifications.length}`);

    // Display admin credentials for testing
    logger.info('\n=== ADMIN CREDENTIALS FOR TESTING ===');
    createdAdmins.forEach((admin, index) => {
      logger.info(`${admin.role.toUpperCase()}:`);
      logger.info(`  Email: ${admin.email}`);
      logger.info(`  Password: ${sampleData.admins[index].password}`);
      logger.info(`  Permissions: ${admin.permissions.join(', ')}`);
      logger.info('');
    });

    // Display sample user credentials
    logger.info('=== SAMPLE USER CREDENTIALS ===');
    createdUsers.slice(0, 3).forEach((user, index) => {
      logger.info(`User ${index + 1}:`);
      logger.info(`  Email: ${user.email}`);
      logger.info(`  Name: ${user.name}`);
      logger.info(`  Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
      logger.info('');
    });

    // Display sample job information
    logger.info('=== SAMPLE JOB INFORMATION ===');
    createdJobs.slice(0, 3).forEach((job, index) => {
      logger.info(`Job ${index + 1}:`);
      logger.info(`  Title: ${job.title}`);
      logger.info(`  Company: ${job.company}`);
      logger.info(`  Type: ${job.type}`);
      logger.info(`  Location: ${job.location}`);
      logger.info(`  Deadline: ${job.applicationDeadline.toDateString()}`);
      logger.info('');
    });

  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
