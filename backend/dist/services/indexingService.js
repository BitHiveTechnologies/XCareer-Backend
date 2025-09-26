"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIndexes = void 0;
const Job_1 = require("../models/Job");
const JobApplication_1 = require("../models/JobApplication");
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const createIndexes = async () => {
    logger_1.logger.info('Starting database indexing...');
    try {
        // User Model Indexes
        await createIndexSafely(User_1.User.collection, { email: 1 }, { unique: true });
        await createIndexSafely(User_1.User.collection, { clerkUserId: 1 }, { unique: true, sparse: true });
        await createIndexSafely(User_1.User.collection, { role: 1 });
        await createIndexSafely(User_1.User.collection, { subscriptionPlan: 1 });
        await createIndexSafely(User_1.User.collection, { subscriptionStatus: 1 });
        await createIndexSafely(User_1.User.collection, { createdAt: -1 }); // For sorting by creation date
        // Job Model Indexes
        await createIndexSafely(Job_1.Job.collection, { title: 1, company: 1 });
        await createIndexSafely(Job_1.Job.collection, { location: 1 });
        await createIndexSafely(Job_1.Job.collection, { type: 1 });
        await createIndexSafely(Job_1.Job.collection, { 'eligibility.qualifications': 1 });
        await createIndexSafely(Job_1.Job.collection, { 'eligibility.streams': 1 });
        await createIndexSafely(Job_1.Job.collection, { 'eligibility.passoutYears': 1 });
        await createIndexSafely(Job_1.Job.collection, { isActive: 1, createdAt: -1 }); // For active jobs, sorted by creation
        await createIndexSafely(Job_1.Job.collection, { postedBy: 1 }); // For fetching jobs by a specific admin
        // Text search index - using proper syntax
        try {
            await Job_1.Job.collection.createIndex({ title: 'text', description: 'text', company: 'text' }, { name: 'JobTextIndex' });
        }
        catch (error) {
            if (error.code === 85) { // IndexOptionsConflict
                logger_1.logger.warn('Text index already exists with different name, skipping...');
            }
            else {
                throw error;
            }
        }
        // JobApplication Model Indexes
        await createIndexSafely(JobApplication_1.JobApplication.collection, { userId: 1, jobId: 1 }, { unique: true }); // Ensure unique application per user per job
        await createIndexSafely(JobApplication_1.JobApplication.collection, { userId: 1, status: 1 }); // For fetching user applications by status
        await createIndexSafely(JobApplication_1.JobApplication.collection, { jobId: 1, status: 1 }); // For fetching job applications by status
        await createIndexSafely(JobApplication_1.JobApplication.collection, { appliedAt: -1 }); // For sorting applications
        // Note: ResumeTemplate and Notification models are not currently exported from models/index.ts
        // These indexes will be added when those models are properly exported
        // Subscription Model Indexes
        await createIndexSafely(Subscription_1.Subscription.collection, { userId: 1 }, { unique: true }); // One active subscription per user
        await createIndexSafely(Subscription_1.Subscription.collection, { status: 1 });
        await createIndexSafely(Subscription_1.Subscription.collection, { plan: 1 });
        await createIndexSafely(Subscription_1.Subscription.collection, { startDate: -1 });
        await createIndexSafely(Subscription_1.Subscription.collection, { endDate: -1 });
        await createIndexSafely(Subscription_1.Subscription.collection, { paymentId: 1 });
        await createIndexSafely(Subscription_1.Subscription.collection, { orderId: 1 });
        // Notification model indexes will be added when the model is properly exported
        logger_1.logger.info('✅ Database indexing completed successfully.');
    }
    catch (error) {
        logger_1.logger.error('❌ Error during database indexing:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'N/A'
        });
        throw error;
    }
};
exports.createIndexes = createIndexes;
// Helper function to create indexes safely
async function createIndexSafely(collection, indexSpec, options = {}) {
    try {
        await collection.createIndex(indexSpec, options);
    }
    catch (error) {
        if (error.code === 85) { // IndexOptionsConflict
            logger_1.logger.warn(`Index already exists with different options, skipping: ${JSON.stringify(indexSpec)}`);
        }
        else if (error.code === 86) { // IndexKeySpecsConflict
            logger_1.logger.warn(`Index already exists with same name but different specs, skipping: ${JSON.stringify(indexSpec)}`);
        }
        else if (error.code === 11000) { // Duplicate key error
            logger_1.logger.warn(`Index already exists, skipping: ${JSON.stringify(indexSpec)}`);
        }
        else {
            logger_1.logger.error(`Failed to create index: ${JSON.stringify(indexSpec)}`, { error: error.message });
            throw error;
        }
    }
}
//# sourceMappingURL=indexingService.js.map