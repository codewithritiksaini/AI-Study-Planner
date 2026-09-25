import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not defined in server/.env');
  process.exit(1);
}

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to database.');

    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`\n📁 Found ${files.length} migration file(s) in supabase/migrations:\n${files.map(f => `  - ${f}`).join('\n')}\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`⚡ Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ ${file} applied successfully.`);
    }

    // Verify all application tables
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN (
        'profiles', 'subjects', 'topics', 'study_sessions', 'study_plans',
        'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers', 'topic_performance'
      )
      ORDER BY table_name;
    `);

    console.log('\n📊 Public Application Tables:');
    console.table(checkTables.rows);

    // Verify RLS status for all tables
    const checkRls = await client.query(`
      SELECT relname as table_name, relrowsecurity as rls_enabled
      FROM pg_class
      WHERE relname IN (
        'profiles', 'subjects', 'topics', 'study_sessions', 'study_plans',
        'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers', 'topic_performance'
      )
      ORDER BY relname;
    `);
    console.log('\n🔒 RLS Status:');
    console.table(checkRls.rows.map(r => ({ table: r.table_name, rls_enabled: r.rls_enabled ? 'YES' : 'NO' })));

    // Verify RLS policies
    const checkPolicies = await client.query(`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE tablename IN (
        'profiles', 'subjects', 'topics', 'study_sessions', 'study_plans',
        'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers', 'topic_performance'
      )
      ORDER BY tablename, cmd;
    `);
    console.log('\n🛡️ Active RLS Policies:');
    console.table(checkPolicies.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
