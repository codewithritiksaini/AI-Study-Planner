/**
 * Centralized Application Error Classes & Error Codes
 * Standardized across all controllers and middlewares.
 */

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

export class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required to access this resource.') {
    super(message, 401, ERROR_CODES.AUTH_REQUIRED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: You do not own or have permission to access this resource.') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request parameters.', details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict: The requested entity already exists or conflicts.') {
    super(message, 409, ERROR_CODES.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please slow down and try again later.') {
    super(message, 429, ERROR_CODES.RATE_LIMITED);
  }
}

export class AiUnavailableError extends AppError {
  constructor(message = 'AI service temporarily unavailable. Falling back to deterministic logic.') {
    super(message, 503, ERROR_CODES.AI_UNAVAILABLE);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database operation error occurred.', details = null) {
    super(message, 500, ERROR_CODES.DATABASE_ERROR, details);
  }
}

export default {
  ERROR_CODES,
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  AiUnavailableError,
  DatabaseError
};
