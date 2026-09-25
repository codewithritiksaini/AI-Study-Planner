import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, aiAndGenerationLimiter } from './middleware/rate-limiter.js';
import healthRoutes from './routes/health.routes.js';
import apiRouter from './routes/index.js';

const app = express();

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // API backend serves JSON, not HTML
  })
);

// 2. CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, Postman) or approved frontend URLs
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body Parsing Middleware with Strict Payload Size Limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Request Logging
app.use(requestLogger);

// 5. Root Liveness & Readiness Probes (Accessible at /health as well as /api/health)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// 6. Rate Limiting for Sensitive/Expensive AI & Schedule Generation Endpoints
app.use('/api/ai', aiAndGenerationLimiter);
app.use('/api/planner/preview', aiAndGenerationLimiter);
app.use('/api/planner/apply', aiAndGenerationLimiter);
app.use('/api/recommendations/refresh', aiAndGenerationLimiter);

// 7. General API Rate Limiting for all other /api endpoints
app.use('/api', apiLimiter);

// 8. Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'AI Study Planner API',
    status: 'online',
    version: '1.0.0',
    health: '/health'
  });
});

// 9. Master API Router
app.use('/api', apiRouter);

// 10. 404 Route Catch-All
app.use(notFound);

// 11. Global Centralized Error Handler (Sanitized output, no stack leakage in prod)
app.use(errorHandler);

export default app;
