import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Job, Admin } from '../src/models';
import { logger } from '../src/utils/logger';

async function populateTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing jobs
    await Job.deleteMany({});
    logger.info('Cleared existing jobs');

    // Get an admin user to post jobs (or create one if none exists)
    let admin = await Admin.findOne();
    if (!admin) {
      admin = new Admin({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'hashedpassword',
        role: 'admin',
        permissions: ['create_job', 'update_job', 'delete_job'],
        isActive: true
      });
      await admin.save();
      logger.info('Created test admin user');
    }

    // Sample jobs data
    const jobsData = [
      // Software Engineering Jobs
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp Solutions',
        description: 'We are looking for a Senior Software Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies. This is a premium position with excellent growth opportunities.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.E', 'M.E'],
          streams: ['CSE', 'IT', 'ECE'],
          passoutYears: [2020, 2021, 2022, 2023, 2024],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-31'),
        applicationLink: 'https://techcorp.com/careers/senior-software-engineer',
        location: 'hybrid',
        salary: '₹15-25 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        description: 'Join our fast-growing startup as a Full Stack Developer. You will work on both frontend and backend development, building innovative solutions for our clients. This position offers great learning opportunities and competitive compensation.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2022, 2023, 2024, 2025],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-11-30'),
        applicationLink: 'https://startupxyz.com/careers/fullstack-dev',
        location: 'remote',
        salary: '₹12-18 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Data Scientist',
        company: 'AI Innovations Ltd',
        description: 'We are seeking a talented Data Scientist to join our AI team. You will work on machine learning models, data analysis, and predictive analytics. This is an enterprise-level position with access to cutting-edge technologies.',
        type: 'job',
        eligibility: {
          qualifications: ['M.Tech', 'M.Sc', 'PhD'],
          streams: ['CSE', 'IT', 'Mathematics', 'Statistics'],
          passoutYears: [2021, 2022, 2023, 2024],
          minCGPA: 8.0
        },
        applicationDeadline: new Date('2025-12-15'),
        applicationLink: 'https://aiinnovations.com/careers/data-scientist',
        location: 'onsite',
        salary: '₹20-35 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'DevOps Engineer',
        company: 'CloudTech Systems',
        description: 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Docker, Kubernetes, and other modern DevOps tools. This position offers excellent growth opportunities.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.E'],
          streams: ['CSE', 'IT', 'ECE'],
          passoutYears: [2020, 2021, 2022, 2023],
          minCGPA: 7.2
        },
        applicationDeadline: new Date('2025-12-20'),
        applicationLink: 'https://cloudtech.com/careers/devops-engineer',
        location: 'hybrid',
        salary: '₹18-28 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Mobile App Developer',
        company: 'AppCraft Studios',
        description: 'Join our mobile development team as a Mobile App Developer. You will work on iOS and Android applications using React Native and Flutter. This is a premium position with opportunities to work on exciting projects.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2022, 2023, 2024, 2025],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-11-25'),
        applicationLink: 'https://appcraft.com/careers/mobile-dev',
        location: 'remote',
        salary: '₹14-22 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Cybersecurity Analyst',
        company: 'SecureNet Solutions',
        description: 'We are looking for a Cybersecurity Analyst to protect our systems and data. You will work on security assessments, vulnerability testing, and incident response. This is an enterprise-level security position.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'],
          streams: ['CSE', 'IT', 'Cybersecurity'],
          passoutYears: [2021, 2022, 2023, 2024],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-10'),
        applicationLink: 'https://securenet.com/careers/cybersecurity-analyst',
        location: 'onsite',
        salary: '₹16-26 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Product Manager',
        company: 'InnovateTech',
        description: 'Join our product team as a Product Manager. You will be responsible for product strategy, roadmap planning, and working with cross-functional teams. This position requires strong analytical and communication skills.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'MBA', 'M.Tech'],
          streams: ['CSE', 'IT', 'Business Administration'],
          passoutYears: [2020, 2021, 2022, 2023],
          minCGPA: 7.8
        },
        applicationDeadline: new Date('2025-12-05'),
        applicationLink: 'https://innovatetech.com/careers/product-manager',
        location: 'hybrid',
        salary: '₹22-35 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'UI/UX Designer',
        company: 'DesignStudio Pro',
        description: 'We are seeking a creative UI/UX Designer to join our design team. You will work on user interface design, user experience research, and prototyping. This position offers opportunities to work on diverse projects.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'B.Des', 'M.Des', 'BCA'],
          streams: ['CSE', 'IT', 'Design'],
          passoutYears: [2022, 2023, 2024, 2025],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-11-20'),
        applicationLink: 'https://designstudio.com/careers/ui-ux-designer',
        location: 'remote',
        salary: '₹12-20 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Backend Developer',
        company: 'APICraft Solutions',
        description: 'Looking for a Backend Developer to build robust APIs and microservices. You will work with Node.js, Python, and cloud technologies. This is a premium backend development position.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2021, 2022, 2023, 2024],
          minCGPA: 7.2
        },
        applicationDeadline: new Date('2025-12-18'),
        applicationLink: 'https://apicraft.com/careers/backend-developer',
        location: 'hybrid',
        salary: '₹15-25 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Machine Learning Engineer',
        company: 'MLTech Innovations',
        description: 'Join our ML team as a Machine Learning Engineer. You will work on ML models, data pipelines, and AI solutions. This is an enterprise-level position with access to advanced ML tools and technologies.',
        type: 'job',
        eligibility: {
          qualifications: ['M.Tech', 'M.Sc', 'PhD', 'B.Tech'],
          streams: ['CSE', 'IT', 'Mathematics', 'Statistics'],
          passoutYears: [2021, 2022, 2023, 2024],
          minCGPA: 8.2
        },
        applicationDeadline: new Date('2025-12-25'),
        applicationLink: 'https://mltech.com/careers/ml-engineer',
        location: 'onsite',
        salary: '₹25-40 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Cloud Solutions Architect',
        company: 'CloudFirst Technologies',
        description: 'We are looking for a Cloud Solutions Architect to design and implement cloud solutions. You will work with AWS, Azure, and GCP to build scalable cloud architectures. This is a senior-level position.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.E', 'M.E'],
          streams: ['CSE', 'IT', 'ECE'],
          passoutYears: [2019, 2020, 2021, 2022, 2023],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-30'),
        applicationLink: 'https://cloudfirst.com/careers/cloud-architect',
        location: 'hybrid',
        salary: '₹30-50 LPA',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Quality Assurance Engineer',
        company: 'TestPro Solutions',
        description: 'Join our QA team as a Quality Assurance Engineer. You will be responsible for testing software applications, creating test cases, and ensuring quality standards. This position offers good growth opportunities.',
        type: 'job',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2022, 2023, 2024, 2025],
          minCGPA: 6.8
        },
        applicationDeadline: new Date('2025-11-15'),
        applicationLink: 'https://testpro.com/careers/qa-engineer',
        location: 'onsite',
        salary: '₹10-16 LPA',
        isActive: true,
        postedBy: admin._id
      }
    ];

    // Sample internships data
    const internshipsData = [
      {
        title: 'Software Development Intern',
        company: 'TechStart Inc',
        description: 'Join our development team as a Software Development Intern. You will work on real projects, learn modern technologies, and gain hands-on experience in software development. This internship offers excellent learning opportunities.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-11-30'),
        applicationLink: 'https://techstart.com/internships/software-dev',
        location: 'remote',
        stipend: '₹15,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Data Science Intern',
        company: 'DataInsights Co',
        description: 'We are offering a Data Science Internship for students interested in data analysis and machine learning. You will work on real datasets, build models, and gain experience in data science tools and techniques.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'],
          streams: ['CSE', 'IT', 'Mathematics', 'Statistics'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-15'),
        applicationLink: 'https://datainsights.com/internships/data-science',
        location: 'hybrid',
        stipend: '₹20,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Frontend Development Intern',
        company: 'WebCraft Studios',
        description: 'Join our frontend team as a Frontend Development Intern. You will work on React, Vue.js, and modern web technologies. This internship provides hands-on experience in building user interfaces.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 6.8
        },
        applicationDeadline: new Date('2025-11-25'),
        applicationLink: 'https://webcraft.com/internships/frontend-dev',
        location: 'remote',
        stipend: '₹12,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Mobile App Development Intern',
        company: 'AppBuilders',
        description: 'We are looking for a Mobile App Development Intern to work on iOS and Android applications. You will learn React Native, Flutter, and mobile development best practices.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-12-10'),
        applicationLink: 'https://appbuilders.com/internships/mobile-dev',
        location: 'hybrid',
        stipend: '₹18,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'DevOps Intern',
        company: 'CloudOps Solutions',
        description: 'Join our DevOps team as an intern and learn about cloud infrastructure, CI/CD pipelines, and automation. You will work with AWS, Docker, and Kubernetes in a real-world environment.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT', 'ECE'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.2
        },
        applicationDeadline: new Date('2025-12-20'),
        applicationLink: 'https://cloudops.com/internships/devops',
        location: 'onsite',
        stipend: '₹16,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'UI/UX Design Intern',
        company: 'CreativeDesign Hub',
        description: 'We are offering a UI/UX Design Internship for creative students. You will work on user interface design, user research, and prototyping. This internship provides hands-on experience in design tools and processes.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'B.Des', 'M.Des', 'BCA'],
          streams: ['CSE', 'IT', 'Design'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 6.5
        },
        applicationDeadline: new Date('2025-11-20'),
        applicationLink: 'https://creativedesign.com/internships/ui-ux',
        location: 'remote',
        stipend: '₹14,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Backend Development Intern',
        company: 'APIBuilders',
        description: 'Join our backend team as an intern and learn about API development, database design, and server-side programming. You will work with Node.js, Python, and various databases.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-12-05'),
        applicationLink: 'https://apibuilders.com/internships/backend-dev',
        location: 'hybrid',
        stipend: '₹17,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Machine Learning Intern',
        company: 'AILab Technologies',
        description: 'We are looking for a Machine Learning Intern to work on ML models and data analysis. You will learn about machine learning algorithms, data preprocessing, and model deployment.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'],
          streams: ['CSE', 'IT', 'Mathematics', 'Statistics'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.8
        },
        applicationDeadline: new Date('2025-12-25'),
        applicationLink: 'https://ailab.com/internships/ml-intern',
        location: 'onsite',
        stipend: '₹22,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Cybersecurity Intern',
        company: 'SecureTech Solutions',
        description: 'Join our cybersecurity team as an intern and learn about security assessments, vulnerability testing, and security tools. You will gain hands-on experience in cybersecurity practices.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'],
          streams: ['CSE', 'IT', 'Cybersecurity'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-12'),
        applicationLink: 'https://securetech.com/internships/cybersecurity',
        location: 'hybrid',
        stipend: '₹19,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Product Management Intern',
        company: 'ProductCraft Inc',
        description: 'We are offering a Product Management Internship for students interested in product strategy and management. You will work on product roadmaps, user research, and cross-functional collaboration.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'MBA', 'M.Tech'],
          streams: ['CSE', 'IT', 'Business Administration'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.2
        },
        applicationDeadline: new Date('2025-11-28'),
        applicationLink: 'https://productcraft.com/internships/product-management',
        location: 'remote',
        stipend: '₹21,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Cloud Computing Intern',
        company: 'CloudTech Academy',
        description: 'Join our cloud team as an intern and learn about cloud platforms, services, and architectures. You will work with AWS, Azure, and GCP to build cloud solutions.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT', 'ECE'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.0
        },
        applicationDeadline: new Date('2025-12-18'),
        applicationLink: 'https://cloudtech.com/internships/cloud-computing',
        location: 'hybrid',
        stipend: '₹18,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Quality Assurance Intern',
        company: 'TestLab Solutions',
        description: 'We are looking for a Quality Assurance Intern to work on software testing and quality assurance processes. You will learn about test automation, manual testing, and QA methodologies.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'BCA', 'MCA'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 6.5
        },
        applicationDeadline: new Date('2025-11-22'),
        applicationLink: 'https://testlab.com/internships/qa-intern',
        location: 'onsite',
        stipend: '₹13,000/month',
        isActive: true,
        postedBy: admin._id
      },
      {
        title: 'Blockchain Development Intern',
        company: 'BlockChain Innovations',
        description: 'Join our blockchain team as an intern and learn about blockchain technology, smart contracts, and decentralized applications. You will work on cutting-edge blockchain projects.',
        type: 'internship',
        eligibility: {
          qualifications: ['B.Tech', 'M.Tech'],
          streams: ['CSE', 'IT'],
          passoutYears: [2024, 2025, 2026],
          minCGPA: 7.5
        },
        applicationDeadline: new Date('2025-12-28'),
        applicationLink: 'https://blockchain.com/internships/blockchain-dev',
        location: 'remote',
        stipend: '₹25,000/month',
        isActive: true,
        postedBy: admin._id
      }
    ];

    // Insert jobs
    logger.info('Inserting jobs...');
    const jobs = await Job.insertMany(jobsData);
    logger.info(`Inserted ${jobs.length} jobs`);

    // Insert internships
    logger.info('Inserting internships...');
    const internships = await Job.insertMany(internshipsData);
    logger.info(`Inserted ${internships.length} internships`);

    // Display summary
    logger.info('\n=== DATA POPULATION SUMMARY ===');
    logger.info(`Total Jobs: ${jobs.length}`);
    logger.info(`Total Internships: ${internships.length}`);
    logger.info(`Total Records: ${jobs.length + internships.length}`);

    // Show some statistics
    const totalActive = await Job.countDocuments({ isActive: true });
    const totalJobs = await Job.countDocuments({ type: 'job', isActive: true });
    const totalInternships = await Job.countDocuments({ type: 'internship', isActive: true });

    logger.info('\n=== DATABASE STATISTICS ===');
    logger.info(`Active Jobs: ${totalJobs}`);
    logger.info(`Active Internships: ${totalInternships}`);
    logger.info(`Total Active Records: ${totalActive}`);

    // Show location distribution
    const locationStats = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    logger.info('\n=== LOCATION DISTRIBUTION ===');
    locationStats.forEach(stat => {
      logger.info(`${stat._id}: ${stat.count} positions`);
    });

    // Show qualification distribution
    const qualificationStats = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$eligibility.qualifications' },
      { $group: { _id: '$eligibility.qualifications', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    logger.info('\n=== QUALIFICATION DISTRIBUTION ===');
    qualificationStats.forEach(stat => {
      logger.info(`${stat._id}: ${stat.count} positions`);
    });

    logger.info('\n✅ Test data population completed successfully!');
    logger.info('You can now test your frontend with diverse job and internship data.');

  } catch (error) {
    logger.error('Failed to populate test data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the script
populateTestData();
