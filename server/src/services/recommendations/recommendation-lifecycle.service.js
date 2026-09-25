/**
 * recommendation-lifecycle.service.js
 *
 * Manages the persistence, state transitions, automatic completion detection,
 * feedback recording, and quality metrics for study recommendations.
 *
 * Status Lifecycle:
 * GENERATED -> ACTIVE -> COMPLETED (action taken / topic finished)
 *                     -> DISMISSED (dismissed by user)
 *                     -> EXPIRED (deadline passed or data updated)
 */

import { query } from '../../config/db.js';

export class RecommendationLifecycleService {
  /**
   * Persists a set of prioritized recommendations for a student.
   * Marks previous active recommendations of the same type/topic as superseded (EXPIRED).
   *
   * @param {string} userId - Student UUID
   * @param {Array<Object>} recommendations - Ranked recommendation candidates
   * @returns {Promise<Array<Object>>} Persisted database rows
   */
  async persistRecommendations(userId, recommendations = []) {
    if (!recommendations || recommendations.length === 0) {
      return [];
    }

    // 1. Mark existing ACTIVE recommendations as EXPIRED to refresh state
    await query(
      `UPDATE public.recommendations
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE user_id = $1 AND status = 'ACTIVE';`,
      [userId]
    );

    const insertedRows = [];

    // 2. Insert new ACTIVE recommendations
    for (const r of recommendations) {
      const res = await query(
        `INSERT INTO public.recommendations (
          user_id,
          type,
          title,
          message,
          priority,
          priority_score,
          subject_id,
          topic_id,
          estimated_minutes,
          reason_json,
          action_json,
          status,
          rule_version,
          generated_at,
          expires_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, 'ACTIVE', 'v1', NOW(), $12
        ) RETURNING *;`,
        [
          userId,
          r.type,
          r.title,
          r.message,
          r.priority,
          r.priority_score || 0,
          r.subject_id || null,
          r.topic_id || null,
          r.estimated_minutes || 30,
          JSON.stringify(r.reason || {}),
          JSON.stringify(r.action || {}),
          r.expires_at || null
        ]
      );

      const inserted = res.rows[0];
      insertedRows.push({
        ...inserted,
        explanation: r.explanation || null
      });
    }

    return insertedRows;
  }

  /**
   * Retrieves active recommendations for a student with optional filtering.
   *
   * @param {string} userId - Student UUID
   * @param {Object} [filters] - type, priority, subjectId, limit
   * @returns {Promise<Array<Object>>}
   */
  async getActiveRecommendations(userId, filters = {}) {
    let sql = `
      SELECT r.*,
             s.name AS subject_name, s.color AS subject_color,
             t.name AS topic_name
      FROM public.recommendations r
      LEFT JOIN public.subjects s ON r.subject_id = s.id
      LEFT JOIN public.topics t ON r.topic_id = t.id
      WHERE r.user_id = $1 AND r.status = 'ACTIVE'
    `;
    const params = [userId];
    let paramIdx = 2;

    if (filters.type) {
      sql += ` AND r.type = $${paramIdx++}`;
      params.push(filters.type);
    }

    if (filters.priority) {
      sql += ` AND r.priority = $${paramIdx++}`;
      params.push(filters.priority);
    }

    if (filters.subjectId) {
      sql += ` AND r.subject_id = $${paramIdx++}`;
      params.push(filters.subjectId);
    }

    sql += ` ORDER BY r.priority_score DESC, r.created_at DESC`;

    const limit = Math.max(1, Math.min(20, Number(filters.limit) || 10));
    sql += ` LIMIT $${paramIdx++}`;
    params.push(limit);

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Retrieves a single recommendation by ID ensuring user ownership.
   */
  async getRecommendationById(userId, recommendationId) {
    const res = await query(
      `SELECT r.*,
              s.name AS subject_name, s.color AS subject_color,
              t.name AS topic_name
       FROM public.recommendations r
       LEFT JOIN public.subjects s ON r.subject_id = s.id
       LEFT JOIN public.topics t ON r.topic_id = t.id
       WHERE r.id = $1 AND r.user_id = $2
       LIMIT 1;`,
      [recommendationId, userId]
    );

    return res.rows[0] || null;
  }

  /**
   * Updates recommendation status (e.g. COMPLETED, DISMISSED, EXPIRED).
   */
  async updateStatus(userId, recommendationId, status) {
    const allowed = ['ACTIVE', 'COMPLETED', 'DISMISSED', 'EXPIRED'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid recommendation status: ${status}`);
    }

    const res = await query(
      `UPDATE public.recommendations
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *;`,
      [status, recommendationId, userId]
    );

    return res.rows[0] || null;
  }

  /**
   * Records student feedback for a recommendation.
   * Also cascades status to DISMISSED or COMPLETED when appropriate.
   */
  async recordFeedback(userId, recommendationId, feedback) {
    const allowed = ['HELPFUL', 'NOT_HELPFUL', 'DISMISS', 'COMPLETED'];
    if (!allowed.includes(feedback)) {
      throw new Error(`Invalid feedback value: ${feedback}`);
    }

    // Verify ownership
    const rec = await this.getRecommendationById(userId, recommendationId);
    if (!rec) {
      throw new Error('Recommendation not found or access denied.');
    }

    // Insert or update feedback
    await query(
      `INSERT INTO public.recommendation_feedback (
        recommendation_id,
        user_id,
        feedback
      ) VALUES ($1, $2, $3)
      ON CONFLICT (user_id, recommendation_id, feedback) DO NOTHING;`,
      [recommendationId, userId, feedback]
    );

    // If feedback indicates dismissal or completion, update recommendation status
    if (feedback === 'DISMISS') {
      await this.updateStatus(userId, recommendationId, 'DISMISSED');
    } else if (feedback === 'COMPLETED') {
      await this.updateStatus(userId, recommendationId, 'COMPLETED');
    }

    return { success: true, feedback, recommendation_id: recommendationId };
  }

  /**
   * Retrieves recommendation history (COMPLETED, DISMISSED, EXPIRED).
   */
  async getHistory(userId, options = {}) {
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 20));
    const res = await query(
      `SELECT r.*,
              s.name AS subject_name, s.color AS subject_color,
              t.name AS topic_name
       FROM public.recommendations r
       LEFT JOIN public.subjects s ON r.subject_id = s.id
       LEFT JOIN public.topics t ON r.topic_id = t.id
       WHERE r.user_id = $1 AND r.status IN ('COMPLETED', 'DISMISSED', 'EXPIRED')
       ORDER BY r.updated_at DESC
       LIMIT $2;`,
      [userId, limit]
    );

    return res.rows;
  }

  /**
   * Computes system-level quality and engagement statistics.
   */
  async getRecommendationStats(userId) {
    const countRes = await query(
      `SELECT
         COUNT(*) AS total_count,
         COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_count,
         COUNT(*) FILTER (WHERE status = 'DISMISSED') AS dismissed_count,
         COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired_count
       FROM public.recommendations
       WHERE user_id = $1;`,
      [userId]
    );

    const feedbackRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE feedback = 'HELPFUL') AS helpful_count,
         COUNT(*) FILTER (WHERE feedback = 'NOT_HELPFUL') AS not_helpful_count
       FROM public.recommendation_feedback
       WHERE user_id = $1;`,
      [userId]
    );

    const counts = countRes.rows[0] || {};
    const feedback = feedbackRes.rows[0] || {};

    const total = Number(counts.total_count) || 0;
    const completed = Number(counts.completed_count) || 0;
    const dismissed = Number(counts.dismissed_count) || 0;
    const active = Number(counts.active_count) || 0;

    const helpful = Number(feedback.helpful_count) || 0;
    const notHelpful = Number(feedback.not_helpful_count) || 0;
    const feedbackTotal = helpful + notHelpful;

    const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
    const helpfulnessRate = feedbackTotal > 0 ? Number(((helpful / feedbackTotal) * 100).toFixed(1)) : 0;

    return {
      total_recommendations: total,
      active_recommendations: active,
      completed_recommendations: completed,
      dismissed_recommendations: dismissed,
      completion_rate: completionRate,
      helpful_count: helpful,
      not_helpful_count: notHelpful,
      helpfulness_rate: helpfulnessRate
    };
  }

  /**
   * Validates freshness of active recommendations.
   * Automatically marks recommendations as COMPLETED or EXPIRED if underlying conditions changed.
   */
  async validateFreshness(userId) {
    // 1. Mark EXPIRED if related subject exam is past
    await query(
      `UPDATE public.recommendations r
       SET status = 'EXPIRED', updated_at = NOW()
       FROM public.subjects s
       WHERE r.subject_id = s.id
         AND r.user_id = $1
         AND r.status = 'ACTIVE'
         AND s.exam_date < CURRENT_DATE;`,
      [userId]
    );

    // 2. Mark COMPLETED if topic was marked completed in topics table
    await query(
      `UPDATE public.recommendations r
       SET status = 'COMPLETED', updated_at = NOW()
       FROM public.topics t
       WHERE r.topic_id = t.id
         AND r.user_id = $1
         AND r.status = 'ACTIVE'
         AND (t.status = 'COMPLETED' OR t.completion_percentage >= 100);`,
      [userId]
    );
  }
}

export const recommendationLifecycleService = new RecommendationLifecycleService();
export default recommendationLifecycleService;
