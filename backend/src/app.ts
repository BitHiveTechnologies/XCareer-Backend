/**
 * app.ts — Express application factory (without server startup).
 * Used by tests so we can control the DB connection separately.
 */
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import all models so they are registered
import './models';

const app = express();

app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// Skip morgan noise in tests
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString('utf8');
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
import routes from './routes';
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
