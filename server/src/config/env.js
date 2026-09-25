import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config();

// Schema defining required vs future variables
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().default(''),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default('')
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Informative warnings for future phase credentials
if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder')) {
  console.info('ℹ️  [Phase 1 Info] SUPABASE_URL not configured yet (Required in Phase 2+).');
}
if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.includes('placeholder')) {
  console.info('ℹ️  [Phase 1 Info] GEMINI_API_KEY not configured yet (Required in Phase 6+).');
}
