import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env
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

    const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/20260925000000_create_profiles.sql');
    console.log(`📄 Reading migration from ${migrationPath}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚡ Executing migration SQL...');
    await client.query(sql);

    console.log('✅ Migration executed successfully!');

    // Verify profiles table structure
    const checkTable = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 profiles table columns:');
    console.table(checkTable.rows);

    // Verify RLS status
    const checkRls = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'profiles';
    `);
    console.log('\n🔒 RLS enabled:', checkRls.rows[0]?.relrowsecurity ? 'YES' : 'NO');

    // Verify policies
    const checkPolicies = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'profiles';
    `);
    console.log('\n🛡️ Active RLS Policies:');
    console.table(checkPolicies.rows.map(p => ({
      name: p.policyname,
      cmd: p.cmd,
      roles: p.roles
    })));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
