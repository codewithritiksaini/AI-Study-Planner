import { env } from '../config/env.js';
import { ERROR_CODES, AppError } from '../utils/errors.js';

/**
 * Global Centralized Error-Handling Middleware
 * Formats all application errors into a standardized, production-safe JSON response:
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: any
 *   }
 * }
 */
export const errorHandler = (err, req, res, next) => {
  // If response headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let errorCode = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected internal server error occurred.';
  let details = null;

  // 1. Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed for request parameters.';
    details = err.errors ? err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    })) : null;
  }
  // 2. Custom AppError instances (AuthError, ForbiddenError, NotFoundError, etc.)
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // 3. PostgreSQL Specific Constraint Violations
  else if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    errorCode = ERROR_CODES.CONFLICT;
    message = 'A record with this identifier or unique attribute already exists.';
    details = env.NODE_ENV === 'development' ? err.detail : null;
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Referenced entity does not exist.';
    details = env.NODE_ENV === 'development' ? err.detail : null;
  } else if (err.code === '23514') {
    // Check constraint violation
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Provided values violate database constraint bounds.';
    details = env.NODE_ENV === 'development' ? err.detail : null;
  }
  // 4. Fallback for generic errors
  else {
    statusCode = err.statusCode || err.status || 500;
    errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;
    
    // In production, mask internal 500 error messages to prevent data leakage
    if (statusCode === 500 && env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred. Please contact support or try again later.';
    } else {
      message = err.message || 'Internal server error.';
    }

    if (env.NODE_ENV === 'development') {
      details = {
        stack: err.stack,
        originalError: err.message
      };
    }
  }

  // Server-side error logging (never logs passwords or tokens)
  if (statusCode >= 500) {
    console.error(`❌ [SERVER ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message || err);
  } else {
    console.warn(`⚠️ [CLIENT ERROR ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details !== null && details !== undefined && { details })
    }
  });
};

export default errorHandler;
