import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origins
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

// 3. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging Middleware
app.use(requestLogger);

// 5. Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Study Planner REST API Server (Phase 1 Foundation)',
    docs: '/api/health'
  });
});

// 6. Master API Router
app.use('/api', apiRouter);

// 7. 404 Route Catch-All
app.use(notFound);

// 8. Global Error Handler
app.use(errorHandler);

export default app;
