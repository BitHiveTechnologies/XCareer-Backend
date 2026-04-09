"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestLimiter_1 = require("./middleware/requestLimiter");
const security_1 = require("./middleware/security");
const indexingService_1 = require("./services/indexingService");
// Import all models to ensure they are registered with mongoose
require("./models");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 5000;
// Enable gzip compression
app.use((0, compression_1.default)());
// Enhanced Security Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
})); // Enhanced security headers
// Request size and timeout limits
app.use((0, requestLimiter_1.requestSizeLimiter)(2 * 1024 * 1024)); // 2MB limit
app.use((0, requestLimiter_1.requestTimeout)(30000)); // 30 second timeout
// Security middleware
app.use(security_1.securityMiddleware);
app.use(security_1.suspiciousActivityMiddleware);
// Rate limiting
app.use(rateLimiter_1.apiLimiter);
// Enhanced CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    process.env['FRONTEND_URL'],
    process.env['ADMIN_FRONTEND_URL']
].filter(Boolean); // Remove undefined values
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Debug logging
        console.log(`🔍 CORS Request from origin: ${origin || 'No origin'}`);
        console.log(`🔍 Allowed origins:`, allowedOrigins);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ Allowing request with no origin');
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            console.log('✅ Origin is in allowed list');
            return callback(null, true);
        }
        // In development, allow any localhost origin
        if (process.env['NODE_ENV'] === 'development' && origin.includes('localhost')) {
            console.log('✅ Allowing localhost origin in development');
            return callback(null, true);
        }
        console.log('❌ Origin not allowed:', origin);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'x-webhook-signature',
        'x-webhook-timestamp',
        'x-api-version',
        'x-client-id',
        'x-client-secret'
    ],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use((0, morgan_1.default)('combined')); // Logging
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
})); // Body parser with raw payload capture for webhooks
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'NotifyX Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'] || 'development'
    });
});
// CORS test endpoint
app.get('/cors-test', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'CORS is working correctly!',
        timestamp: new Date().toISOString(),
        origin: _req.headers.origin || 'No origin header',
        allowedOrigins: allowedOrigins
    });
});
// Debug endpoint to test models
app.get('/debug/models', async (_req, res) => {
    try {
        const { Job, Admin, User } = await Promise.resolve().then(() => __importStar(require('./models')));
        const jobCount = await Job.countDocuments();
        const adminCount = await Admin.countDocuments();
        const userCount = await User.countDocuments();
        res.status(200).json({
            success: true,
            models: {
                Job: { registered: true, count: jobCount },
                Admin: { registered: true, count: adminCount },
                User: { registered: true, count: userCount }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Debug endpoint to test job query
app.get('/debug/jobs', async (_req, res) => {
    try {
        const { Job } = await Promise.resolve().then(() => __importStar(require('./models')));
        console.log('Testing job query...');
        const query = { isActive: true };
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('postedBy', 'name email');
        console.log(`Found ${jobs.length} jobs`);
        const total = await Job.countDocuments(query);
        console.log(`Total jobs: ${total}`);
        res.status(200).json({
            success: true,
            data: {
                jobs: jobs.map(job => ({
                    id: job._id,
                    title: job.title,
                    company: job.company,
                    type: job.type,
                    location: job.location,
                    postedBy: job.postedBy
                })),
                total,
                count: jobs.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Debug jobs error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
});
// API routes
const routes_1 = __importDefault(require("./routes"));
app.use('/api', routes_1.default);
// Error handling middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDB)();
        // Initialize database indexes
        await (0, indexingService_1.createIndexes)();
        app.listen(PORT, () => {
            console.log(`🚀 NotifyX Backend server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map