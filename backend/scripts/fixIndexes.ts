import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { logger } from '../src/utils/logger';

async function fixIndexes() {
  try {
    logger.info('🔧 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('jobs');

    logger.info('🗑️ Dropping existing indexes...');
    
    // Get all indexes
    const indexes = await collection.indexes();
    logger.info(`Found ${indexes.length} indexes`);

    // Drop all indexes except the default _id index
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          logger.info(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          logger.warn(`⚠️ Could not drop index ${index.name}: ${error}`);
        }
      }
    }

    logger.info('✅ All problematic indexes dropped');
    logger.info('🔄 Recreating indexes...');

    // Recreate the correct indexes
    await collection.createIndex({ title: 1 });
    await collection.createIndex({ company: 1 });
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ location: 1 });
    await collection.createIndex({ isActive: 1 });
    await collection.createIndex({ applicationDeadline: 1 });
    await collection.createIndex({ postedBy: 1 });
    await collection.createIndex({ createdAt: -1 });

    // Compound indexes for common queries
    await collection.createIndex({ isActive: 1, type: 1 });
    await collection.createIndex({ isActive: 1, location: 1 });
    await collection.createIndex({ isActive: 1, applicationDeadline: 1 });

    // Individual array field indexes (no compound indexes on arrays)
    await collection.createIndex({ 'eligibility.qualifications': 1 });
    await collection.createIndex({ 'eligibility.streams': 1 });
    await collection.createIndex({ 'eligibility.passoutYears': 1 });

    // Text index for search functionality
    await collection.createIndex({
      title: 'text',
      company: 'text',
      description: 'text'
    });

    logger.info('✅ All indexes recreated successfully');
    logger.info('🎉 Index fix completed!');

  } catch (error) {
    logger.error('❌ Index fix failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('📤 Disconnected from MongoDB');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixIndexes()
    .then(() => {
      logger.info('✅ Index fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Index fix failed:', error);
      process.exit(1);
    });
}

export { fixIndexes };

