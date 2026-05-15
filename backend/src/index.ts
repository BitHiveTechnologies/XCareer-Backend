import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import all models to ensure they are registered with mongoose
import './models';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 5000;

// Middleware
app.use(helmet()); // Security headers

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

app.use(cors({
  origin: (origin, callback) => {
    // Debug logging
    ; void /* console.log */ ((..._args) => {})(`🔍 CORS Request from origin: ${origin || 'No origin'}`);
    ; void /* console.log */ ((..._args) => {})(`🔍 Allowed origins:`, allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      ; void /* console.log */ ((..._args) => {})('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      ; void /* console.log */ ((..._args) => {})('✅ Origin is in allowed list');
      return callback(null, true);
    }
    
    // In development, allow any localhost origin
    if (process.env['NODE_ENV'] === 'development' && origin.includes('localhost')) {
      ; void /* console.log */ ((..._args) => {})('✅ Allowing localhost origin in development');
      return callback(null, true);
    }
    
    ; void /* console.log */ ((..._args) => {})('❌ Origin not allowed:', origin);
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
    'Pragma'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
})); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    const { Job, Admin, User } = await import('./models');
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
  } catch (error) {
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
    const { Job } = await import('./models');
    
    ; void /* console.log */ ((..._args) => {})('Testing job query...');
    const query = { isActive: true };
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('postedBy', 'name email');
    
    ; void /* console.log */ ((..._args) => {})(`Found ${jobs.length} jobs`);
    
    const total = await Job.countDocuments(query);
    ; void /* console.log */ ((..._args) => {})(`Total jobs: ${total}`);
    
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
  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('Debug jobs error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
import routes from './routes';
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      ; void /* console.log */ ((..._args) => {})(`🚀 NotifyX Backend server running on port ${PORT}`);
      ; void /* console.log */ ((..._args) => {})(`📊 Health check: http://localhost:${PORT}/health`);
      ; void /* console.log */ ((..._args) => {})(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    ; void /* console.error */ ((..._args) => {})('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  ; void /* console.error */ ((..._args) => {})('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  ; void /* console.error */ ((..._args) => {})('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();
