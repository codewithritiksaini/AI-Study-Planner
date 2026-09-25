import { query } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export class TopicService {
  /**
   * Verifies that the given subject is owned by the authenticated student.
   */
  async verifySubjectOwnership(subjectId, userId) {
    const text = `
      SELECT id, name
      FROM public.subjects
      WHERE id = $1 AND user_id = $2;
    `;
    const res = await query(text, [subjectId, userId]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves all topics for a given subject, strictly checking user ownership.
   */
  async getTopicsBySubjectId(subjectId, userId) {
    const subject = await this.verifySubjectOwnership(subjectId, userId);
    if (!subject) {
      return null;
    }

    const text = `
      SELECT
        id,
        subject_id,
        name,
        description,
        difficulty,
        estimated_minutes,
        status,
        completion_percentage::float AS completion_percentage,
        created_at,
        updated_at
      FROM public.topics
      WHERE subject_id = $1
      ORDER BY created_at ASC;
    `;
    const res = await query(text, [subjectId]);
    return res.rows;
  }

  /**
   * Retrieves a single topic by ID, strictly verifying parent subject ownership.
   */
  async getTopicById(topicId, userId) {
    const text = `
      SELECT
        t.id,
        t.subject_id,
        t.name,
        t.description,
        t.difficulty,
        t.estimated_minutes,
        t.status,
        t.completion_percentage::float AS completion_percentage,
        t.created_at,
        t.updated_at,
        s.name AS subject_name,
        s.color AS subject_color
      FROM public.topics t
      JOIN public.subjects s ON s.id = t.subject_id
      WHERE t.id = $1 AND s.user_id = $2;
    `;
    const res = await query(text, [topicId, userId]);
    return res.rows[0] || null;
  }

  /**
   * Creates a new topic under a subject, verifying parent subject ownership.
   */
  async createTopic(subjectId, userId, data) {
    const subject = await this.verifySubjectOwnership(subjectId, userId);
    if (!subject) {
      return null;
    }

    // Determine consistent initial status & completion percentage
    let completion = 0.00;
    if (data.completion_percentage !== undefined) {
      completion = parseFloat(data.completion_percentage);
    }

    let status = data.status || 'NOT_STARTED';
    if (completion === 100) {
      status = 'COMPLETED';
    } else if (completion > 0 && status === 'NOT_STARTED') {
      status = 'IN_PROGRESS';
    }

    const text = `
      INSERT INTO public.topics (
        subject_id,
        name,
        description,
        difficulty,
        estimated_minutes,
        status,
        completion_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        subject_id,
        name,
        description,
        difficulty,
        estimated_minutes,
        status,
        completion_percentage::float AS completion_percentage,
        created_at,
        updated_at;
    `;
    const values = [
      subjectId,
      data.name.trim(),
      data.description?.trim() || null,
      data.difficulty || 'MEDIUM',
      data.estimated_minutes || 60,
      status,
      completion
    ];

    const res = await query(text, values);
    appCache.invalidateUser(userId);
    return res.rows[0];
  }

  /**
   * Updates an existing topic, verifying parent subject ownership.
   * Enforces consistency between status and completion_percentage.
   */
  async updateTopic(topicId, userId, data) {
    const existing = await this.getTopicById(topicId, userId);
    if (!existing) {
      return null;
    }

    let completion = data.completion_percentage !== undefined
      ? parseFloat(data.completion_percentage)
      : existing.completion_percentage;

    let status = data.status || existing.status;

    // Consistency rules:
    if (data.completion_percentage !== undefined && data.status === undefined) {
      if (completion === 100) {
        status = 'COMPLETED';
      } else if (completion === 0) {
        status = 'NOT_STARTED';
      } else {
        status = 'IN_PROGRESS';
      }
    } else if (data.status !== undefined && data.completion_percentage === undefined) {
      if (status === 'COMPLETED') {
        completion = 100.00;
      } else if (status === 'NOT_STARTED') {
        completion = 0.00;
      }
    }

    const text = `
      UPDATE public.topics
      SET
        name = COALESCE($2, name),
        description = CASE WHEN $3::boolean THEN $4 ELSE description END,
        difficulty = COALESCE($5, difficulty),
        estimated_minutes = COALESCE($6, estimated_minutes),
        status = $7,
        completion_percentage = $8,
        updated_at = timezone('utc'::text, now())
      WHERE id = $1
      RETURNING
        id,
        subject_id,
        name,
        description,
        difficulty,
        estimated_minutes,
        status,
        completion_percentage::float AS completion_percentage,
        created_at,
        updated_at;
    `;
    const values = [
      topicId,
      data.name?.trim() || null,
      data.description !== undefined, // whether to update description
      data.description?.trim() || null,
      data.difficulty || null,
      data.estimated_minutes !== undefined ? parseInt(data.estimated_minutes, 10) : null,
      status,
      completion
    ];

    const res = await query(text, values);
    appCache.invalidateUser(userId);
    return res.rows[0];
  }

  /**
   * Updates topic progress directly (e.g. quick-complete).
   */
  async updateTopicProgress(topicId, userId, completionPercentage) {
    const percentage = Math.min(100, Math.max(0, parseFloat(completionPercentage)));
    let status = 'IN_PROGRESS';
    if (percentage === 100) {
      status = 'COMPLETED';
    } else if (percentage === 0) {
      status = 'NOT_STARTED';
    }

    return this.updateTopic(topicId, userId, {
      completion_percentage: percentage,
      status
    });
  }

  /**
   * Deletes a topic, verifying parent subject ownership.
   */
  async deleteTopic(topicId, userId) {
    const existing = await this.getTopicById(topicId, userId);
    if (!existing) {
      return null;
    }

    const text = `
      DELETE FROM public.topics
      WHERE id = $1
      RETURNING id, name, subject_id;
    `;
    const res = await query(text, [topicId]);
    appCache.invalidateUser(userId);
    return res.rows[0];
  }
}

export const topicService = new TopicService();
