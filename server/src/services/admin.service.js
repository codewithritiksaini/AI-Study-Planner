import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export class AdminService {
  /**
   * Retrieves high-level platform health, engagement counters, and database telemetry.
   */
  async getPlatformOverview() {
    const startTime = performance.now();

    // Run parallel aggregation queries across platform tables
    const [
      studentsCountRes,
      subjectsCountRes,
      topicsCountRes,
      sessionsCountRes,
      completedSessionsRes,
      dbLatencyPing
    ] = await Promise.all([
      query(`SELECT count(*)::int AS total FROM public.profiles WHERE role = 'student';`),
      query(`SELECT count(*)::int AS total FROM public.subjects;`),
      query(`SELECT count(*)::int AS total FROM public.topics;`),
      query(`SELECT count(*)::int AS total FROM public.study_sessions;`),
      query(`SELECT count(*)::int AS total FROM public.study_sessions WHERE status = 'COMPLETED';`),
      query(`SELECT 1;`)
    ]);

    const dbLatencyMs = Math.round(performance.now() - startTime);

    return {
      metrics: {
        total_students: studentsCountRes.rows[0]?.total || 0,
        total_subjects: subjectsCountRes.rows[0]?.total || 0,
        total_topics: topicsCountRes.rows[0]?.total || 0,
        total_study_sessions: sessionsCountRes.rows[0]?.total || 0,
        completed_sessions: completedSessionsRes.rows[0]?.total || 0
      },
      system: {
        database: 'connected',
        db_latency_ms: dbLatencyMs,
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        cache_stats: appCache.getStats ? appCache.getStats() : { active: true }
      }
    };
  }

  /**
   * Retrieves registered student roster with academic scope & session metrics.
   * Excludes sensitive credential hashes.
   */
  async getAllStudents({ limit = 50, offset = 0, search = '' } = {}) {
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    let whereClause = `WHERE role = 'student' OR role IS NULL`;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClause += ` AND (LOWER(full_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }

    params.push(safeLimit);
    const limitParamIndex = params.length;
    params.push(safeOffset);
    const offsetParamIndex = params.length;

    const sql = `
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.role,
        p.branch,
        p.semester,
        p.target_cgpa,
        p.created_at,
        (SELECT count(*)::int FROM public.subjects s WHERE s.user_id = p.id) AS subject_count,
        (SELECT count(*)::int FROM public.study_sessions ss WHERE ss.user_id = p.id) AS session_count
      FROM public.profiles p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
    `;

    const countSql = `
      SELECT count(*)::int AS total
      FROM public.profiles p
      ${whereClause};
    `;

    const [listRes, countRes] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, params.length - 2))
    ]);

    return {
      students: listRes.rows,
      pagination: {
        total: countRes.rows[0]?.total || 0,
        limit: safeLimit,
        offset: safeOffset
      }
    };
  }
}

export const adminService = new AdminService();
