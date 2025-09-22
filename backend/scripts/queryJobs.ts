import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Job } from '../src/models/Job';
import { logger } from '../src/utils/logger';

async function queryJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    logger.info('=== DIFFERENT WAYS TO QUERY JOBS ===\n');

    // 1. Get all active jobs
    logger.info('1. ALL ACTIVE JOBS:');
    const allActiveJobs = await Job.find({ isActive: true })
      .select('title company type location applicationDeadline')
      .sort({ createdAt: -1 })
      .limit(10);
    
    allActiveJobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company} (${job.type})`);
    });

    // 2. Get jobs by type
    logger.info('\n2. JOBS BY TYPE:');
    const regularJobs = await Job.find({ type: 'job', isActive: true }).countDocuments();
    const internships = await Job.find({ type: 'internship', isActive: true }).countDocuments();
    logger.info(`   Regular Jobs: ${regularJobs}`);
    logger.info(`   Internships: ${internships}`);

    // 3. Get jobs by location
    logger.info('\n3. JOBS BY LOCATION:');
    const remoteJobs = await Job.find({ location: 'remote', isActive: true }).countDocuments();
    const onsiteJobs = await Job.find({ location: 'onsite', isActive: true }).countDocuments();
    const hybridJobs = await Job.find({ location: 'hybrid', isActive: true }).countDocuments();
    logger.info(`   Remote: ${remoteJobs}`);
    logger.info(`   Onsite: ${onsiteJobs}`);
    logger.info(`   Hybrid: ${hybridJobs}`);

    // 4. Search jobs by text
    logger.info('\n4. SEARCH JOBS BY TEXT (searching for "engineer"):');
    const searchResults = await Job.find({
      $or: [
        { title: { $regex: 'engineer', $options: 'i' } },
        { company: { $regex: 'engineer', $options: 'i' } },
        { description: { $regex: 'engineer', $options: 'i' } }
      ],
      isActive: true
    }).select('title company type').limit(5);
    
    searchResults.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
    });

    // 5. Get jobs by qualification
    logger.info('\n5. JOBS BY QUALIFICATION (B.Tech):');
    const btechJobs = await Job.find({
      'eligibility.qualifications': 'B.Tech',
      isActive: true
    }).select('title company eligibility.qualifications').limit(5);
    
    btechJobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Qualifications: ${job.eligibility.qualifications.join(', ')}`);
    });

    // 6. Get jobs by stream
    logger.info('\n6. JOBS BY STREAM (CSE):');
    const cseJobs = await Job.find({
      'eligibility.streams': 'CSE',
      isActive: true
    }).select('title company eligibility.streams').limit(5);
    
    cseJobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Streams: ${job.eligibility.streams.join(', ')}`);
    });

    // 7. Get jobs by passout year
    logger.info('\n7. JOBS BY PASSOUT YEAR (2024):');
    const year2024Jobs = await Job.find({
      'eligibility.passoutYears': 2024,
      isActive: true
    }).select('title company eligibility.passoutYears').limit(5);
    
    year2024Jobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Passout Years: ${job.eligibility.passoutYears.join(', ')}`);
    });

    // 8. Get jobs with salary information
    logger.info('\n8. JOBS WITH SALARY INFORMATION:');
    const jobsWithSalary = await Job.find({
      salary: { $exists: true, $ne: null },
      isActive: true
    }).select('title company salary type').limit(5);
    
    jobsWithSalary.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Salary: ${job.salary || 'Not specified'}`);
    });

    // 9. Get jobs with stipend information
    logger.info('\n9. JOBS WITH STIPEND INFORMATION:');
    const jobsWithStipend = await Job.find({
      stipend: { $exists: true, $ne: null },
      isActive: true
    }).select('title company stipend type').limit(5);
    
    jobsWithStipend.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Stipend: ${job.stipend || 'Not specified'}`);
    });

    // 10. Get jobs expiring soon
    logger.info('\n10. JOBS EXPIRING SOON (next 30 days):');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringJobs = await Job.find({
      isActive: true,
      applicationDeadline: { $lte: thirtyDaysFromNow }
    }).select('title company applicationDeadline').sort({ applicationDeadline: 1 }).limit(5);
    
    expiringJobs.forEach((job, index) => {
      const daysLeft = Math.ceil((job.applicationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      logger.info(`   ${index + 1}. ${job.title} at ${job.company} (${daysLeft} days left)`);
    });

    // 11. Get jobs with specific CGPA requirement
    logger.info('\n11. JOBS WITH CGPA REQUIREMENT (7.0 or higher):');
    const cgpaJobs = await Job.find({
      'eligibility.minCGPA': { $gte: 7.0 },
      isActive: true
    }).select('title company eligibility.minCGPA').limit(5);
    
    cgpaJobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Min CGPA: ${job.eligibility.minCGPA || 'Not specified'}`);
    });

    // 12. Get jobs posted by specific admin
    logger.info('\n12. JOBS BY ADMIN (first admin):');
    const firstAdmin = await Job.findOne({ isActive: true }).select('postedBy');
    if (firstAdmin) {
      const adminJobs = await Job.find({
        postedBy: firstAdmin.postedBy,
        isActive: true
      }).select('title company postedBy').limit(5);
      
      adminJobs.forEach((job, index) => {
        logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      });
    }

    // 13. Complex query: Jobs for CSE graduates with 7.5+ CGPA
    logger.info('\n13. COMPLEX QUERY: CSE jobs with 7.5+ CGPA:');
    const complexQueryJobs = await Job.find({
      'eligibility.streams': 'CSE',
      'eligibility.minCGPA': { $lte: 7.5 },
      isActive: true
    }).select('title company eligibility').limit(5);
    
    complexQueryJobs.forEach((job, index) => {
      logger.info(`   ${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`      Streams: ${job.eligibility.streams.join(', ')}`);
      logger.info(`      Min CGPA: ${job.eligibility.minCGPA || 'Not specified'}`);
    });

    // 14. Get job statistics
    logger.info('\n14. JOB STATISTICS:');
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const jobTypeCount = await Job.countDocuments({ type: 'job', isActive: true });
    const internshipCount = await Job.countDocuments({ type: 'internship', isActive: true });
    
    logger.info(`   Total Jobs: ${totalJobs}`);
    logger.info(`   Active Jobs: ${activeJobs}`);
    logger.info(`   Regular Jobs: ${jobTypeCount}`);
    logger.info(`   Internships: ${internshipCount}`);

  } catch (error) {
    logger.error('Error querying jobs:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the query if this file is executed directly
if (require.main === module) {
  queryJobs()
    .then(() => {
      logger.info('Job query completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Job query failed:', error);
      process.exit(1);
    });
}

export { queryJobs };

