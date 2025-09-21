import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Job, Admin, User } from '../src/models';
import { logger } from '../src/utils/logger';

async function debugJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Test basic job query
    logger.info('Testing basic job query...');
    const jobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('postedBy', 'name email');
    
    logger.info(`Found ${jobs.length} jobs`);
    
    jobs.forEach((job, index) => {
      logger.info(`${index + 1}. ${job.title} at ${job.company}`);
    });

    // Test subscription service
    logger.info('Testing subscription service...');
    try {
      const { canAccessPremiumFeatures, canAccessEnterpriseFeatures } = await import('../src/utils/subscriptionService');
      logger.info('Subscription service imported successfully');
      
      // Test with a dummy user ID
      const testUserId = '507f1f77bcf86cd799439011';
      const canAccessPremium = await canAccessPremiumFeatures(testUserId);
      const canAccessEnterprise = await canAccessEnterpriseFeatures(testUserId);
      
      logger.info(`Premium access: ${canAccessPremium}`);
      logger.info(`Enterprise access: ${canAccessEnterprise}`);
    } catch (subscriptionError) {
      logger.error('Subscription service error:', subscriptionError);
    }

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Debug failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

debugJobs();
