import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Job } from '../src/models/Job';
import { logger } from '../src/utils/logger';

async function checkJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check total jobs count
    const totalJobs = await Job.countDocuments();
    logger.info(`Total jobs in database: ${totalJobs}`);

    // Check active jobs count
    const activeJobs = await Job.countDocuments({ isActive: true });
    logger.info(`Active jobs: ${activeJobs}`);

    // Check inactive jobs count
    const inactiveJobs = await Job.countDocuments({ isActive: false });
    logger.info(`Inactive jobs: ${inactiveJobs}`);

    // Check jobs by type
    const jobTypeCount = await Job.countDocuments({ type: 'job', isActive: true });
    const internshipCount = await Job.countDocuments({ type: 'internship', isActive: true });
    logger.info(`Regular jobs: ${jobTypeCount}`);
    logger.info(`Internships: ${internshipCount}`);

    // Check jobs by location
    const remoteJobs = await Job.countDocuments({ location: 'remote', isActive: true });
    const onsiteJobs = await Job.countDocuments({ location: 'onsite', isActive: true });
    const hybridJobs = await Job.countDocuments({ location: 'hybrid', isActive: true });
    logger.info(`Remote jobs: ${remoteJobs}`);
    logger.info(`Onsite jobs: ${onsiteJobs}`);
    logger.info(`Hybrid jobs: ${hybridJobs}`);

    // Get recent jobs (last 5)
    const recentJobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company type location applicationDeadline createdAt')
      .populate('postedBy', 'name email');

    logger.info('\n=== RECENT JOBS ===');
    recentJobs.forEach((job, index) => {
      logger.info(`${index + 1}. ${job.title} at ${job.company}`);
      logger.info(`   Type: ${job.type} | Location: ${job.location}`);
      logger.info(`   Deadline: ${job.applicationDeadline.toDateString()}`);
      logger.info(`   Posted by: ${(job.postedBy as any)?.name || 'Unknown'}`);
      logger.info(`   Created: ${job.createdAt.toDateString()}`);
      logger.info('');
    });

    // Get jobs expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringJobs = await Job.find({
      isActive: true,
      applicationDeadline: { $lte: sevenDaysFromNow }
    })
    .select('title company applicationDeadline')
    .sort({ applicationDeadline: 1 });

    logger.info('=== JOBS EXPIRING SOON (Next 7 days) ===');
    if (expiringJobs.length > 0) {
      expiringJobs.forEach((job, index) => {
        const daysLeft = Math.ceil((job.applicationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        logger.info(`${index + 1}. ${job.title} at ${job.company} (${daysLeft} days left)`);
      });
    } else {
      logger.info('No jobs expiring in the next 7 days');
    }

    // Get job statistics by company
    const companyStats = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$company',
          jobCount: { $sum: 1 }
        }
      },
      { $sort: { jobCount: -1 } },
      { $limit: 10 }
    ]);

    logger.info('\n=== TOP COMPANIES BY JOB POSTINGS ===');
    companyStats.forEach((company, index) => {
      logger.info(`${index + 1}. ${company._id}: ${company.jobCount} jobs`);
    });

    // Get qualification distribution
    const qualificationStats = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$eligibility.qualifications' },
      {
        $group: {
          _id: '$eligibility.qualifications',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    logger.info('\n=== QUALIFICATION DISTRIBUTION ===');
    qualificationStats.forEach((qual, index) => {
      logger.info(`${index + 1}. ${qual._id}: ${qual.count} jobs`);
    });

    // Get stream distribution
    const streamStats = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$eligibility.streams' },
      {
        $group: {
          _id: '$eligibility.streams',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    logger.info('\n=== STREAM DISTRIBUTION ===');
    streamStats.forEach((stream, index) => {
      logger.info(`${index + 1}. ${stream._id}: ${stream.count} jobs`);
    });

  } catch (error) {
    logger.error('Error checking jobs:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkJobs()
    .then(() => {
      logger.info('Job check completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Job check failed:', error);
      process.exit(1);
    });
}

export { checkJobs };
