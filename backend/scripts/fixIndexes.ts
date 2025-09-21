import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { Job } from '../src/models/Job';
import { logger } from '../src/utils/logger';

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Drop all indexes on the jobs collection
    logger.info('Dropping all indexes on jobs collection...');
    await Job.collection.dropIndexes();
    logger.info('All indexes dropped successfully');

    // Recreate the indexes one by one
    logger.info('Recreating indexes...');
    
    // Basic indexes
    await Job.collection.createIndex({ title: 1 });
    await Job.collection.createIndex({ company: 1 });
    await Job.collection.createIndex({ type: 1 });
    await Job.collection.createIndex({ location: 1 });
    await Job.collection.createIndex({ isActive: 1 });
    await Job.collection.createIndex({ applicationDeadline: 1 });
    await Job.collection.createIndex({ postedBy: 1 });
    await Job.collection.createIndex({ createdAt: -1 });

    // Compound indexes
    await Job.collection.createIndex({ isActive: 1, type: 1 });
    await Job.collection.createIndex({ isActive: 1, location: 1 });
    await Job.collection.createIndex({ isActive: 1, applicationDeadline: 1 });

    // Individual array field indexes
    await Job.collection.createIndex({ 'eligibility.qualifications': 1 });
    await Job.collection.createIndex({ 'eligibility.streams': 1 });
    await Job.collection.createIndex({ 'eligibility.passoutYears': 1 });

    // Text index for search
    await Job.collection.createIndex({
      title: 'text',
      company: 'text',
      description: 'text'
    });

    logger.info('All indexes recreated successfully');

    // List all indexes
    const indexes = await Job.collection.listIndexes().toArray();
    logger.info('Current indexes:');
    indexes.forEach((index, i) => {
      logger.info(`${i + 1}. ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    logger.error('Error fixing indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixIndexes()
    .then(() => {
      logger.info('Index fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index fix failed:', error);
      process.exit(1);
    });
}

export { fixIndexes };