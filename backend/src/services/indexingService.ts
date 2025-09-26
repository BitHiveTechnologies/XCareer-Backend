import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export const createIndexes = async (): Promise<void> => {
  logger.info('Starting database indexing...');
  try {
    // User Model Indexes
    await createIndexSafely(User.collection, { email: 1 }, { unique: true });
    await createIndexSafely(User.collection, { clerkUserId: 1 }, { unique: true, sparse: true });
    await createIndexSafely(User.collection, { role: 1 });
    await createIndexSafely(User.collection, { subscriptionPlan: 1 });
    await createIndexSafely(User.collection, { subscriptionStatus: 1 });
    await createIndexSafely(User.collection, { createdAt: -1 }); // For sorting by creation date

    // Job Model Indexes
    await createIndexSafely(Job.collection, { title: 1, company: 1 });
    await createIndexSafely(Job.collection, { location: 1 });
    await createIndexSafely(Job.collection, { type: 1 });
    await createIndexSafely(Job.collection, { 'eligibility.qualifications': 1 });
    await createIndexSafely(Job.collection, { 'eligibility.streams': 1 });
    await createIndexSafely(Job.collection, { 'eligibility.passoutYears': 1 });
    await createIndexSafely(Job.collection, { isActive: 1, createdAt: -1 }); // For active jobs, sorted by creation
    await createIndexSafely(Job.collection, { postedBy: 1 }); // For fetching jobs by a specific admin
    // Text search index - using proper syntax
    try {
      await Job.collection.createIndex({ title: 'text', description: 'text', company: 'text' }, { name: 'JobTextIndex' });
    } catch (error: any) {
      if (error.code === 85) { // IndexOptionsConflict
        logger.warn('Text index already exists with different name, skipping...');
      } else {
        throw error;
      }
    }

    // JobApplication Model Indexes
    await createIndexSafely(JobApplication.collection, { userId: 1, jobId: 1 }, { unique: true }); // Ensure unique application per user per job
    await createIndexSafely(JobApplication.collection, { userId: 1, status: 1 }); // For fetching user applications by status
    await createIndexSafely(JobApplication.collection, { jobId: 1, status: 1 }); // For fetching job applications by status
    await createIndexSafely(JobApplication.collection, { appliedAt: -1 }); // For sorting applications

    // Note: ResumeTemplate and Notification models are not currently exported from models/index.ts
    // These indexes will be added when those models are properly exported

    // Subscription Model Indexes
    await createIndexSafely(Subscription.collection, { userId: 1 }, { unique: true }); // One active subscription per user
    await createIndexSafely(Subscription.collection, { status: 1 });
    await createIndexSafely(Subscription.collection, { plan: 1 });
    await createIndexSafely(Subscription.collection, { startDate: -1 });
    await createIndexSafely(Subscription.collection, { endDate: -1 });
    await createIndexSafely(Subscription.collection, { paymentId: 1 });
    await createIndexSafely(Subscription.collection, { orderId: 1 });

    // Notification model indexes will be added when the model is properly exported

    logger.info('✅ Database indexing completed successfully.');
  } catch (error) {
    logger.error('❌ Error during database indexing:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'N/A'
    });
    throw error;
  }
};

// Helper function to create indexes safely
async function createIndexSafely(collection: any, indexSpec: any, options: any = {}): Promise<void> {
  try {
    await collection.createIndex(indexSpec, options);
  } catch (error: any) {
    if (error.code === 85) { // IndexOptionsConflict
      logger.warn(`Index already exists with different options, skipping: ${JSON.stringify(indexSpec)}`);
    } else if (error.code === 86) { // IndexKeySpecsConflict
      logger.warn(`Index already exists with same name but different specs, skipping: ${JSON.stringify(indexSpec)}`);
    } else if (error.code === 11000) { // Duplicate key error
      logger.warn(`Index already exists, skipping: ${JSON.stringify(indexSpec)}`);
    } else {
      logger.error(`Failed to create index: ${JSON.stringify(indexSpec)}`, { error: error.message });
      throw error;
    }
  }
}