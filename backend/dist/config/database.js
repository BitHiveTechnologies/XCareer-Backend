"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const queryInterceptor_1 = require("../middleware/queryInterceptor");
const performanceService_1 = require("../services/performanceService");
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/notifyx';
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(MONGODB_URI, {
            // Connection Pool Settings
            maxPoolSize: 20, // Increased from 10 to 20 for better concurrency
            minPoolSize: 5, // Maintain minimum 5 connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            // Timeout Settings
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            connectTimeoutMS: 10000, // Connection timeout
            // Performance Settings
            bufferCommands: false, // Disable mongoose buffering
            // Write Concern
            writeConcern: {
                w: 'majority',
                j: true, // Journal write concern
                wtimeout: 10000 // 10 second timeout
            },
            // Read Preference
            readPreference: 'primary', // Always read from primary for consistency
            // Compression
            compressors: ['zlib'], // Enable compression
            // Retry Settings
            retryWrites: true,
            retryReads: true
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        // Setup query interceptor for performance monitoring
        (0, queryInterceptor_1.setupQueryInterceptor)();
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        // Performance monitoring
        mongoose_1.default.connection.on('open', () => {
            console.log('📊 Performance monitoring enabled');
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                // Log final performance stats
                const stats = performanceService_1.performanceService.getStats();
                console.log('📊 Final Performance Stats:', {
                    totalQueries: stats.totalQueries,
                    averageResponseTime: `${stats.averageResponseTime.toFixed(2)}ms`,
                    slowQueries: stats.slowQueries,
                    errorRate: `${(stats.errorRate * 100).toFixed(2)}%`
                });
                await mongoose_1.default.connection.close();
                console.log('✅ MongoDB connection closed through app termination');
                process.exit(0);
            }
            catch (err) {
                console.error('❌ Error during MongoDB connection closure:', err);
                process.exit(1);
            }
        });
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        console.log('✅ MongoDB connection closed');
    }
    catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map