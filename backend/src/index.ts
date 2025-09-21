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
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Body parser
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
  } catch (error) {
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
      console.log(`🚀 NotifyX Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();
