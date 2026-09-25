import { query } from '../config/db.js';

export class StudyService {
  /**
   * Starts a new study session for an authenticated student.
   * Enforces subject ownership, topic-subject alignment, and single-active-session invariant.
   */
  async startSession(userId, { subjectId, topicId = null }) {
    // 1. Verify subject exists and belongs to the authenticated user
    const subRes = await query(
      `SELECT id, name, color FROM public.subjects WHERE id = $1 AND user_id = $2;`,
      [subjectId, userId]
    );

    if (subRes.rows.length === 0) {
      const error = new Error('Subject not found or does not belong to the authenticated student.');
      error.code = 'SUBJECT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // 2. If a topicId is provided, verify it belongs to this subject and user
    if (topicId) {
      const topRes = await query(
        `
        SELECT t.id, t.name, t.difficulty, t.estimated_minutes, t.subject_id, s.user_id
        FROM public.topics t
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE t.id = $1;
        `,
        [topicId]
      );

      if (topRes.rows.length === 0) {
        const error = new Error('Topic not found.');
        error.code = 'TOPIC_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      const topic = topRes.rows[0];
      if (topic.subject_id !== subjectId || topic.user_id !== userId) {
        const error = new Error('The selected topic does not belong to the specified subject.');
        error.code = 'TOPIC_SUBJECT_MISMATCH';
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Verify student does not already have an active IN_PROGRESS session
    const activeRes = await query(
      `SELECT id, started_at FROM public.study_sessions WHERE user_id = $1 AND status = 'IN_PROGRESS';`,
      [userId]
    );

    if (activeRes.rows.length > 0) {
      const error = new Error('You already have an active study session in progress. Please complete or cancel it first.');
      error.code = 'ACTIVE_SESSION_EXISTS';
      error.statusCode = 409;
      throw error;
    }

    // 4. Create new IN_PROGRESS session with server-authoritative timestamp
    const insertRes = await query(
      `
      INSERT INTO public.study_sessions (
        user_id,
        subject_id,
        topic_id,
        started_at,
        status
      )
      VALUES ($1, $2, $3, now(), 'IN_PROGRESS')
      RETURNING id;
      `,
      [userId, subjectId, topicId || null]
    );

    const sessionId = insertRes.rows[0].id;
    return await this.getSessionById(sessionId, userId);
  }

  /**
   * Retrieves the student's currently active study session (if any).
   * Essential for browser reload and page refresh recovery.
   */
  async getActiveSession(userId) {
    const text = `
      SELECT 
        ss.id,
        ss.user_id,
        ss.subject_id,
        ss.topic_id,
        ss.started_at,
        ss.ended_at,
        ss.duration_minutes,
        ss.status,
        ss.notes,
        ss.confidence_level,
        ss.difficulty_feedback,
        ss.created_at,
        ss.updated_at,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.estimated_minutes AS topic_estimated_minutes
      FROM public.study_sessions ss
      LEFT JOIN public.subjects s ON s.id = ss.subject_id
      LEFT JOIN public.topics t ON t.id = ss.topic_id
      WHERE ss.user_id = $1 AND ss.status = 'IN_PROGRESS'
      ORDER BY ss.started_at DESC
      LIMIT 1;
    `;
    const res = await query(text, [userId]);
    return res.rows[0] || null;
  }

  /**
   * Completes an in-progress study session.
   * Calculates validated duration on the server and stores optional reflections.
   */
  async completeSession(userId, sessionId, { notes = null, confidenceLevel = null, difficultyFeedback = null }) {
    // 1. Verify session exists and is owned by the user
    const checkRes = await query(
      `SELECT id, status, started_at FROM public.study_sessions WHERE id = $1 AND user_id = $2;`,
      [sessionId, userId]
    );

    if (checkRes.rows.length === 0) {
      const error = new Error('Study session not found or access denied.');
      error.code = 'SESSION_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const session = checkRes.rows[0];
    if (session.status !== 'IN_PROGRESS') {
      const error = new Error(`Cannot complete a study session that is already ${session.status.toLowerCase()}.`);
      error.code = 'SESSION_NOT_ACTIVE';
      error.statusCode = 409;
      throw error;
    }

    // 2. Server-side authoritative duration calculation (minimum 1 minute if completed)
    const updateRes = await query(
      `
      UPDATE public.study_sessions
      SET 
        ended_at = now(),
        duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (now() - started_at)) / 60)::int),
        status = 'COMPLETED',
        notes = $3,
        confidence_level = $4,
        difficulty_feedback = $5,
        updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id;
      `,
      [
        sessionId,
        userId,
        notes?.trim() || null,
        confidenceLevel || null,
        difficultyFeedback || null
      ]
    );

    return await this.getSessionById(sessionId, userId);
  }

  /**
   * Cancels an in-progress study session without recording completed study time.
   */
  async cancelSession(userId, sessionId) {
    const checkRes = await query(
      `SELECT id, status FROM public.study_sessions WHERE id = $1 AND user_id = $2;`,
      [sessionId, userId]
    );

    if (checkRes.rows.length === 0) {
      const error = new Error('Study session not found or access denied.');
      error.code = 'SESSION_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const session = checkRes.rows[0];
    if (session.status !== 'IN_PROGRESS') {
      const error = new Error(`Cannot cancel a study session that is already ${session.status.toLowerCase()}.`);
      error.code = 'SESSION_NOT_ACTIVE';
      error.statusCode = 409;
      throw error;
    }

    await query(
      `
      UPDATE public.study_sessions
      SET 
        ended_at = now(),
        duration_minutes = 0,
        status = 'CANCELLED',
        updated_at = now()
      WHERE id = $1 AND user_id = $2;
      `,
      [sessionId, userId]
    );

    return await this.getSessionById(sessionId, userId);
  }

  /**
   * Retrieves today's completed study sessions with aggregated metrics.
   */
  async getTodaySessions(userId) {
    const text = `
      SELECT 
        ss.id,
        ss.user_id,
        ss.subject_id,
        ss.topic_id,
        ss.started_at,
        ss.ended_at,
        ss.duration_minutes,
        ss.status,
        ss.notes,
        ss.confidence_level,
        ss.difficulty_feedback,
        ss.created_at,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name
      FROM public.study_sessions ss
      LEFT JOIN public.subjects s ON s.id = ss.subject_id
      LEFT JOIN public.topics t ON t.id = ss.topic_id
      WHERE ss.user_id = $1 
        AND ss.started_at >= CURRENT_DATE
        AND ss.status = 'COMPLETED'
      ORDER BY ss.started_at DESC;
    `;
    const res = await query(text, [userId]);
    const sessions = res.rows;

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const sessionCount = sessions.length;

    return {
      total_minutes: totalMinutes,
      session_count: sessionCount,
      sessions
    };
  }

  /**
   * Retrieves paginated study session history for the authenticated user.
   */
  async getSessionHistory(userId, { page = 1, limit = 20, subjectId = null }) {
    const offset = (page - 1) * limit;
    const queryParams = [userId, limit, offset];
    let subjectFilter = '';

    if (subjectId) {
      queryParams.push(subjectId);
      subjectFilter = `AND ss.subject_id = $4`;
    }

    const countText = `
      SELECT COUNT(*)::int AS total
      FROM public.study_sessions ss
      WHERE ss.user_id = $1 
        AND ss.status IN ('COMPLETED', 'CANCELLED', 'INTERRUPTED')
        ${subjectId ? 'AND ss.subject_id = $2' : ''};
    `;
    const countParams = subjectId ? [userId, subjectId] : [userId];
    const countRes = await query(countText, countParams);
    const total = countRes.rows[0]?.total || 0;

    const dataText = `
      SELECT 
        ss.id,
        ss.user_id,
        ss.subject_id,
        ss.topic_id,
        ss.started_at,
        ss.ended_at,
        ss.duration_minutes,
        ss.status,
        ss.notes,
        ss.confidence_level,
        ss.difficulty_feedback,
        ss.created_at,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name
      FROM public.study_sessions ss
      LEFT JOIN public.subjects s ON s.id = ss.subject_id
      LEFT JOIN public.topics t ON t.id = ss.topic_id
      WHERE ss.user_id = $1 
        AND ss.status IN ('COMPLETED', 'CANCELLED', 'INTERRUPTED')
        ${subjectFilter}
      ORDER BY ss.started_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const dataRes = await query(dataText, queryParams);

    return {
      sessions: dataRes.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieves basic study summary metrics (today, this week, total completed).
   */
  async getStudySummary(userId) {
    const todayRes = await query(
      `
      SELECT 
        COALESCE(SUM(duration_minutes), 0)::int AS total_minutes,
        COUNT(*)::int AS session_count
      FROM public.study_sessions
      WHERE user_id = $1 AND started_at >= CURRENT_DATE AND status = 'COMPLETED';
      `,
      [userId]
    );

    const weekRes = await query(
      `
      SELECT 
        COALESCE(SUM(duration_minutes), 0)::int AS total_minutes,
        COUNT(*)::int AS session_count
      FROM public.study_sessions
      WHERE user_id = $1 AND started_at >= date_trunc('week', CURRENT_DATE) AND status = 'COMPLETED';
      `,
      [userId]
    );

    const allTimeRes = await query(
      `
      SELECT 
        COALESCE(SUM(duration_minutes), 0)::int AS total_minutes,
        COUNT(*)::int AS session_count
      FROM public.study_sessions
      WHERE user_id = $1 AND status = 'COMPLETED';
      `,
      [userId]
    );

    return {
      today: todayRes.rows[0] || { total_minutes: 0, session_count: 0 },
      this_week: weekRes.rows[0] || { total_minutes: 0, session_count: 0 },
      all_time: allTimeRes.rows[0] || { total_minutes: 0, session_count: 0 }
    };
  }

  /**
   * Helper: Fetches full single session row by ID and user ID.
   */
  async getSessionById(sessionId, userId) {
    const text = `
      SELECT 
        ss.id,
        ss.user_id,
        ss.subject_id,
        ss.topic_id,
        ss.started_at,
        ss.ended_at,
        ss.duration_minutes,
        ss.status,
        ss.notes,
        ss.confidence_level,
        ss.difficulty_feedback,
        ss.created_at,
        ss.updated_at,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.estimated_minutes AS topic_estimated_minutes
      FROM public.study_sessions ss
      LEFT JOIN public.subjects s ON s.id = ss.subject_id
      LEFT JOIN public.topics t ON t.id = ss.topic_id
      WHERE ss.id = $1 AND ss.user_id = $2;
    `;
    const res = await query(text, [sessionId, userId]);
    return res.rows[0] || null;
  }
}

export const studyService = new StudyService();
