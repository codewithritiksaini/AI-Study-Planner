import { env } from './env.js';

/**
 * Centralized AI & Gemini Configuration
 * Enforces timeouts, generation parameters, token bounds, and retry policies.
 */
export const AI_CONFIG = {
  // Model selection (ultra-fast, responsive lite models)
  model: 'gemini-3.5-flash-lite',
  fallbackModels: ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite'],

  // Network & execution limits (fast 8s timeout, 1 retry)
  timeoutMs: 8000,
  maxRetries: 1,

  // Generation parameters
  generationConfig: {
    temperature: 0.2, // Low temperature for deterministic, factual reasoning
    topP: 0.95,
    maxOutputTokens: 8192
  },

  // Input boundaries
  constraints: {
    maxAskMessageLength: 4000,
    maxRecentSessionsInContext: 10,
    maxTopicsInContext: 25,
    maxRecommendationsReturned: 5,
    minQuizQuestions: 3,
    maxQuizQuestions: 20,
    defaultQuizQuestions: 5
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
