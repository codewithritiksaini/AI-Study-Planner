import { query } from '../config/db.js';

export class SubjectService {
  /**
   * Retrieves all subjects belonging to the authenticated student,
   * along with aggregated topic metrics and calculated syllabus progress.
   */
  async getSubjectsByUserId(userId) {
    const text = `
      SELECT
        s.id,
        s.user_id,
        s.name,
        s.description,
        s.exam_date,
        s.target_score,
        s.color,
        s.icon,
        s.created_at,
        s.updated_at,
        COUNT(t.id)::int AS topic_count,
        COUNT(CASE WHEN t.status = 'COMPLETED' OR t.completion_percentage = 100 THEN 1 END)::int AS completed_topic_count,
        ROUND(COALESCE(AVG(t.completion_percentage), 0), 1)::float AS syllabus_progress_percentage,
        CASE
          WHEN s.exam_date IS NOT NULL THEN (s.exam_date - CURRENT_DATE)::int
          ELSE NULL
        END AS days_until_exam
      FROM public.subjects s
      LEFT JOIN public.topics t ON t.subject_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id
      ORDER BY
        CASE WHEN s.exam_date IS NOT NULL AND s.exam_date >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
        s.exam_date ASC NULLS LAST,
        s.created_at DESC;
    `;
    const res = await query(text, [userId]);
    return res.rows;
  }

  /**
   * Retrieves a single subject and its associated topics for the user.
   */
  async getSubjectById(subjectId, userId) {
    const subjectText = `
      SELECT
        s.id,
        s.user_id,
        s.name,
        s.description,
        s.exam_date,
        s.target_score,
        s.color,
        s.icon,
        s.created_at,
        s.updated_at,
        COUNT(t.id)::int AS topic_count,
        COUNT(CASE WHEN t.status = 'COMPLETED' OR t.completion_percentage = 100 THEN 1 END)::int AS completed_topic_count,
        ROUND(COALESCE(AVG(t.completion_percentage), 0), 1)::float AS syllabus_progress_percentage,
        CASE
          WHEN s.exam_date IS NOT NULL THEN (s.exam_date - CURRENT_DATE)::int
          ELSE NULL
        END AS days_until_exam
      FROM public.subjects s
      LEFT JOIN public.topics t ON t.subject_id = s.id
      WHERE s.id = $1 AND s.user_id = $2
      GROUP BY s.id;
    `;
    const subjectRes = await query(subjectText, [subjectId, userId]);
    const subject = subjectRes.rows[0];

    if (!subject) {
      return null;
    }

    const topicsText = `
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
    const topicsRes = await query(topicsText, [subjectId]);
    subject.topics = topicsRes.rows;

    return subject;
  }

  /**
   * Creates a new subject for the authenticated user.
   */
  async createSubject(userId, data) {
    const text = `
      INSERT INTO public.subjects (
        user_id,
        name,
        description,
        exam_date,
        target_score,
        color,
        icon
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      userId,
      data.name.trim(),
      data.description?.trim() || null,
      data.exam_date || null,
      data.target_score !== undefined ? data.target_score : null,
      data.color || '#4f46e5',
      data.icon || 'BookOpen'
    ];

    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Updates an existing subject owned by the user.
   */
  async updateSubject(subjectId, userId, data) {
    const allowedFields = ['name', 'description', 'exam_date', 'target_score', 'color', 'icon'];
    const updates = [];
    const values = [subjectId, userId];
    let paramIndex = 3;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(typeof data[field] === 'string' ? data[field].trim() : data[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.getSubjectById(subjectId, userId);
    }

    updates.push(`updated_at = timezone('utc'::text, now())`);

    const text = `
      UPDATE public.subjects
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;

    const res = await query(text, values);
    return res.rows[0] || null;
  }

  /**
   * Deletes a subject owned by the user (cascades to topics).
   */
  async deleteSubject(subjectId, userId) {
    const text = `
      DELETE FROM public.subjects
      WHERE id = $1 AND user_id = $2
      RETURNING id, name;
    `;
    const res = await query(text, [subjectId, userId]);
    return res.rows[0] || null;
  }

  /**
   * Computes aggregated academic metrics for the student's dashboard.
   */
  async getDashboardSummary(userId) {
    // 1. Total subjects count
    const subjectsCountRes = await query(
      `SELECT COUNT(*)::int AS total FROM public.subjects WHERE user_id = $1;`,
      [userId]
    );
    const totalSubjects = subjectsCountRes.rows[0]?.total || 0;

    // 2. Total topics and overall syllabus progress
    const topicsAggRes = await query(
      `
      SELECT
        COUNT(t.id)::int AS total_topics,
        ROUND(COALESCE(AVG(t.completion_percentage), 0), 1)::float AS overall_syllabus_progress
      FROM public.topics t
      JOIN public.subjects s ON s.id = t.subject_id
      WHERE s.user_id = $1;
      `,
      [userId]
    );
    const totalTopics = topicsAggRes.rows[0]?.total_topics || 0;
    const overallSyllabusProgress = topicsAggRes.rows[0]?.overall_syllabus_progress || 0;

    // 3. Nearest upcoming exam
    const upcomingExamRes = await query(
      `
      SELECT
        id,
        name,
        exam_date,
        (exam_date - CURRENT_DATE)::int AS days_until_exam,
        color
      FROM public.subjects
      WHERE user_id = $1 AND exam_date IS NOT NULL AND exam_date >= CURRENT_DATE
      ORDER BY exam_date ASC
      LIMIT 1;
      `,
      [userId]
    );
    const upcomingExam = upcomingExamRes.rows[0] || null;

    return {
      totalSubjects,
      totalTopics,
      overallSyllabusProgress,
      upcomingExam
    };
  }
}

export const subjectService = new SubjectService();
