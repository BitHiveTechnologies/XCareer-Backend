"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQueryInterceptor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const performanceService_1 = require("../services/performanceService");
/**
 * Database query interceptor for performance monitoring
 */
const setupQueryInterceptor = () => {
    // Intercept Mongoose queries
    const originalExec = mongoose_1.default.Query.prototype.exec;
    const originalAggregate = mongoose_1.default.Aggregate.prototype.exec;
    // Query interceptor
    mongoose_1.default.Query.prototype.exec = function (...args) {
        const startTime = Date.now();
        const collection = this.model?.collection?.name || 'unknown';
        const operation = this.op || 'find';
        return originalExec.apply(this, args)
            .then((result) => {
            const duration = Date.now() - startTime;
            performanceService_1.performanceService.recordQuery(operation, collection, duration, this.getQuery());
            return result;
        })
            .catch((error) => {
            const duration = Date.now() - startTime;
            performanceService_1.performanceService.recordQuery(operation, collection, duration, this.getQuery(), error.message);
            throw error;
        });
    };
    // Aggregate interceptor
    mongoose_1.default.Aggregate.prototype.exec = function (...args) {
        const startTime = Date.now();
        const collection = this.model?.collection?.name || 'unknown';
        const operation = 'aggregate';
        return originalAggregate.apply(this, args)
            .then((result) => {
            const duration = Date.now() - startTime;
            performanceService_1.performanceService.recordQuery(operation, collection, duration, this.pipeline());
            return result;
        })
            .catch((error) => {
            const duration = Date.now() - startTime;
            performanceService_1.performanceService.recordQuery(operation, collection, duration, this.pipeline(), error.message);
            throw error;
        });
    };
};
exports.setupQueryInterceptor = setupQueryInterceptor;
//# sourceMappingURL=queryInterceptor.js.map