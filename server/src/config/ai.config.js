import { env } from './env.js';

/**
 * Centralized AI & Gemini Configuration
 * Enforces timeouts, generation parameters, token bounds, and retry policies.
 */
export const AI_CONFIG = {
  // Model selection
  model: env.GEMINI_MODEL || 'gemini-2.5-flash',

  // Network & execution limits
  timeoutMs: 15000,
  maxRetries: 1,

  // Generation parameters
  generationConfig: {
    temperature: 0.2, // Low temperature for deterministic, factual reasoning
    topP: 0.95,
    maxOutputTokens: 1024
  },

  // Input boundaries
  constraints: {
    maxAskMessageLength: 4000,
    maxRecentSessionsInContext: 10,
    maxTopicsInContext: 25,
    maxRecommendationsReturned: 5
  },

  // Normalized AI Error Codes
  errorCodes: {
    CONFIG_ERROR: 'AI_CONFIG_ERROR',
    AUTH_ERROR: 'AI_AUTH_ERROR',
    RATE_LIMITED: 'AI_RATE_LIMITED',
    TIMEOUT: 'AI_TIMEOUT',
    PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
    INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
    VALIDATION_ERROR: 'AI_VALIDATION_ERROR'
  }
};
