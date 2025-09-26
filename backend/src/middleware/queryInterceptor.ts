import mongoose from 'mongoose';
import { performanceService } from '../services/performanceService';

/**
 * Database query interceptor for performance monitoring
 */
export const setupQueryInterceptor = (): void => {
  // Intercept Mongoose queries
  const originalExec = mongoose.Query.prototype.exec;
  const originalAggregate = mongoose.Aggregate.prototype.exec;

  // Query interceptor
  mongoose.Query.prototype.exec = function(this: any, ...args: any[]) {
    const startTime = Date.now();
    const collection = this.model?.collection?.name || 'unknown';
    const operation = this.op || 'find';

    return originalExec.apply(this, args)
      .then((result: any) => {
        const duration = Date.now() - startTime;
        performanceService.recordQuery(operation, collection, duration, this.getQuery());
        return result;
      })
      .catch((error: any) => {
        const duration = Date.now() - startTime;
        performanceService.recordQuery(operation, collection, duration, this.getQuery(), error.message);
        throw error;
      });
  };

  // Aggregate interceptor
  mongoose.Aggregate.prototype.exec = function(this: any, ...args: any[]) {
    const startTime = Date.now();
    const collection = this.model?.collection?.name || 'unknown';
    const operation = 'aggregate';

    return originalAggregate.apply(this, args)
      .then((result: any) => {
        const duration = Date.now() - startTime;
        performanceService.recordQuery(operation, collection, duration, this.pipeline());
        return result;
      })
      .catch((error: any) => {
        const duration = Date.now() - startTime;
        performanceService.recordQuery(operation, collection, duration, this.pipeline(), error.message);
        throw error;
      });
  };
};
