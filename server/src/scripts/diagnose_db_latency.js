import dns from 'dns/promises';
import { getDbPool, query } from '../config/db.js';
import { env } from '../config/env.js';

async function diagnose() {
  console.log('🔍 Starting Comprehensive Supabase Latency & Performance Diagnostic...\n');

  try {
    // 1. Parse Database URL
    const url = new URL(env.DATABASE_URL);
    const host = url.hostname;
    const port = url.port || 5432;
    console.log(`📡 Database Host: ${host}`);
    console.log(`🔌 Database Port: ${port} (${port === '6543' ? 'PgBouncer Transaction Pooler' : 'Direct Session / Postgres'})`);

    // 2. DNS Resolution Time
    console.log('\n--- 1. DNS Resolution Speed ---');
    const dnsStart = performance.now();
    const addresses = await dns.lookup(host, { all: true });
    const dnsTime = (performance.now() - dnsStart).toFixed(2);
    console.log(`✅ DNS resolved in ${dnsTime}ms to:`, addresses.map(a => `${a.address} (IPv${a.family})`).join(', '));

    // 3. Connection Handshake Time
    console.log('\n--- 2. Pool Client Checkout & Handshake Latency ---');
    const pool = getDbPool();
    const connectStart = performance.now();
    const client = await pool.connect();
    const connectTime = (performance.now() - connectStart).toFixed(2);
    console.log(`✅ Pool client acquired in ${connectTime}ms`);
    client.release();

    // 4. Repeated Query Latencies (Cold vs Warm)
    console.log('\n--- 3. Query Execution Roundtrips (5 trials) ---');
    for (let i = 1; i <= 5; i++) {
      const qStart = performance.now();
      await query('SELECT 1 AS ping, now() AS server_time;');
      const qTime = (performance.now() - qStart).toFixed(2);
      console.log(`  Trial ${i}: ${qTime}ms`);
    }

    // 5. High-Frequency Table Query Speeds
    console.log('\n--- 4. Core Query Latencies for Seed Student ---');
    const studentUser = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
    const userId = studentUser.rows[0]?.id;

    if (userId) {
      const t1 = performance.now();
      const subs = await query(`SELECT * FROM public.subjects WHERE user_id = $1;`, [userId]);
      console.log(`  Subjects Query (${subs.rows.length} rows): ${(performance.now() - t1).toFixed(2)}ms`);

      const t2 = performance.now();
      const plans = await query(`SELECT * FROM public.study_plans WHERE user_id = $1 LIMIT 50;`, [userId]);
      console.log(`  Study Plans Query (${plans.rows.length} rows): ${(performance.now() - t2).toFixed(2)}ms`);

      const t3 = performance.now();
      const recs = await query(`SELECT * FROM public.recommendations WHERE user_id = $1;`, [userId]);
      console.log(`  Recommendations Query (${recs.rows.length} rows): ${(performance.now() - t3).toFixed(2)}ms`);
    }

    // 6. Check Active Connections on Supabase
    console.log('\n--- 5. Active Connections & PgBouncer Health ---');
    const connCheck = await query(`SELECT count(*) as total_connections FROM pg_stat_activity;`);
    console.log(`  Total Active Postgres Connections: ${connCheck.rows[0]?.total_connections}`);

    console.log('\n🎯 Diagnostic complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Diagnostic FAILED:', err);
    process.exit(1);
  }
}

diagnose();
