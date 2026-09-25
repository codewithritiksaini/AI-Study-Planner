import { env } from '../config/env.js';

/**
 * Global centralized error-handling middleware.
 * Formats all uncaught errors into a consistent JSON envelope.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  console.error(`❌ [ERROR] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(env.NODE_ENV === 'development' && { details: err.stack })
    }
  });
};
