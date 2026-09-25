import dotenv from 'dotenv';
import { validateEnvironment } from './env.validator.js';

// Load environment variables from .env
dotenv.config();

let validatedEnv;
try {
  validatedEnv = validateEnvironment(process.env);
} catch (err) {
  // If in test runner with custom mocks, allow graceful error handling, otherwise exit
  if (process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL) {
    console.warn('⚠️ [TEST RUNNER] Running test with partial environment.');
    validatedEnv = {
      PORT: 5000,
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      GEMINI_API_KEY: 'test-gemini-key',
      GEMINI_MODEL: 'gemini-3.8-flash'
    };
  } else {
    process.exit(1);
  }
}

export const env = validatedEnv;
export default env;
