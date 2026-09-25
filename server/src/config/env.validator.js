import { z } from 'zod';

/**
 * Environment Schema Specification
 * Validates backend runtime configuration.
 */
export const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().default(''),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash')
});

/**
 * Validates environment variables and throws clean diagnostic error on failure.
 * @param {object} rawEnv - process.env
 * @returns {object} Validated environment variables
 */
export function validateEnvironment(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => {
      return `  - ${issue.path.join('.')}: ${issue.message}`;
    }).join('\n');

    const errorMessage = `\n❌ [STARTUP CRITICAL] Invalid Environment Configuration:\n${errorDetails}\n\nPlease check your .env file or deployment configuration before starting the server.\n`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Security guardrail: Ensure secrets are not accidentally exposed as placeholder strings
  const validated = result.data;
  if (validated.NODE_ENV === 'production') {
    if (validated.SUPABASE_URL.includes('placeholder') || validated.SUPABASE_URL.includes('localhost')) {
      throw new Error('❌ [SECURITY ERROR] Production cannot use localhost or placeholder for SUPABASE_URL');
    }
  }

  return validated;
}

export default validateEnvironment;
