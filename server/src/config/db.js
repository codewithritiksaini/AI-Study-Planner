import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

let poolInstance = null;

/**
 * Returns a PostgreSQL connection pool.
 * Uses DATABASE_URL for robust, performant queries.
 */
export const getDbPool = () => {
  if (poolInstance) {
    return poolInstance;
  }

  if (!env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set. Direct database queries will fail.');
    return null;
  }

  try {
    poolInstance = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      min: 4,
      max: 15,
      idleTimeoutMillis: 300000,
      connectionTimeoutMillis: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle database client', err.message);
    });

    return poolInstance;
  } catch (error) {
    console.error('Failed to create PostgreSQL pool:', error.message);
    return null;
  }
};

/**
 * Helper to run parameterized queries on the database.
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, ...)
 * @param {Array} params - Parameter values
 */
export const query = async (text, params = []) => {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('Database connection pool is not available.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Never log raw query text with sensitive parameters in production
  if (env.NODE_ENV === 'development') {
    // safe diagnostic duration
  }
  return res;
};

let keepAliveTimer = null;

/**
 * Pre-warms the database connection pool on server boot so the first user
 * request does not incur cold-start SSL handshake latency.
 */
export const warmupDatabasePool = async () => {
  try {
    const pool = getDbPool();
    if (!pool) return;
    const start = Date.now();
    await pool.query('SELECT 1;');
    console.log(`⚡ [DB WARMUP] Database connection pool pre-warmed in ${Date.now() - start}ms`);
    startDbKeepAlive();
  } catch (err) {
    console.warn('⚠️ [DB WARMUP] Initial database warmup failed:', err.message);
  }
};

/**
 * Periodically pings the database every 90 seconds to prevent domestic ISP/NAT
 * routers and firewalls from dropping idle SSL sockets.
 */
export const startDbKeepAlive = (intervalMs = 90000) => {
  if (keepAliveTimer || env.NODE_ENV === 'test') return;
  keepAliveTimer = setInterval(async () => {
    try {
      const pool = getDbPool();
      if (pool) {
        await pool.query('SELECT 1;');
      }
    } catch {
      // Ignore background keepalive error
    }
  }, intervalMs);
  if (keepAliveTimer.unref) keepAliveTimer.unref();
};
