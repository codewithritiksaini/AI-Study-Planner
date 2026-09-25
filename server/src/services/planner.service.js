import { query } from '../config/db.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';
import {
  calculateExamUrgency,
  calculateCompletionNeed,
  calculateDifficultyScore,
  calculateInactivityScore,
  calculatePriorityScore,
  generateReason
} from './priority.service.js';
import {
  calculateAvailableMinutes,
  allocateTasks,
  createTimeSlots,
  validateSchedule
} from './scheduling.service.js';

class PlannerService {
  /**
   * Generates a deterministic study plan for a specific date.
   * - Filters out completed topics.
   * - Ranks candidates by priority.
   * - Respects daily availability and study window.
   * - Implements safe regeneration (preserves COMPLETED and IN_PROGRESS plans).
   */
  async generatePlan(userId, { date, forceRegenerate = false }) {
    const planningDate = date || new Date().toISOString().split('T')[0];

    // 1. Fetch Student Profile
    const profileRes = await query(
      `SELECT id, daily_available_hours, preferred_study_start_time, preferred_study_end_time, timezone
       FROM public.profiles
       WHERE id = $1;`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      const err = new Error('Student profile not found. Please complete your profile first.');
      err.statusCode = 404;
      err.code = 'PROFILE_NOT_FOUND';
      throw err;
    }
    const profile = profileRes.rows[0];

    // 2. Fetch Existing Plans for this date with joined subject and topic data
    const existingRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC;`,
      [userId, planningDate]
    );
    const existingPlans = existingRes.rows;

    // If plans exist and not force regenerating, return the existing plan
    if (existingPlans.length > 0 && !forceRegenerate) {
      return this.formatPlanResponse(planningDate, existingPlans, profile);
    }

    // Identify preserved plans (COMPLETED, IN_PROGRESS)
    const preservedPlans = existingPlans.filter(
      p => p.status === PLANNER_CONFIG.statuses.COMPLETED || p.status === PLANNER_CONFIG.statuses.IN_PROGRESS
    );

    // Calculate minutes already committed to preserved plans
    const preservedMinutes = preservedPlans.reduce((sum, p) => sum + (Number(p.planned_minutes) || 0), 0);
    const totalAvailableMinutes = calculateAvailableMinutes(profile);

    // 3. Fetch Enrolled Subjects
    const subjRes = await query(
      `SELECT id, name, exam_date, target_score, color
       FROM public.subjects
       WHERE user_id = $1;`,
      [userId]
    );
    const subjects = subjRes.rows;

    if (subjects.length === 0) {
      return {
        date: planningDate,
        total_planned_minutes: preservedMinutes,
        completed_minutes: preservedPlans.filter(p => p.status === PLANNER_CONFIG.statuses.COMPLETED).reduce((s, p) => s + p.planned_minutes, 0),
        pending_minutes: 0,
        available_minutes: totalAvailableMinutes,
        plans: preservedPlans,
        message: 'Add subjects and topics before generating a study plan.'
      };
    }

    // 4. Fetch Eligible Incomplete Topics (status != 'COMPLETED' AND completion_percentage < 100)
    const subjectIds = subjects.map(s => s.id);
    const topicsRes = await query(
      `SELECT id, subject_id, name, difficulty, estimated_minutes, status, completion_percentage
       FROM public.topics
       WHERE subject_id = ANY($1::uuid[])
         AND status != 'COMPLETED'
         AND (completion_percentage IS NULL OR completion_percentage < 100);`,
      [subjectIds]
    );
    const topics = topicsRes.rows;

    if (topics.length === 0) {
      return {
        date: planningDate,
        total_planned_minutes: preservedMinutes,
        completed_minutes: preservedPlans.filter(p => p.status === PLANNER_CONFIG.statuses.COMPLETED).reduce((s, p) => s + p.planned_minutes, 0),
        pending_minutes: 0,
        available_minutes: totalAvailableMinutes,
        plans: preservedPlans,
        message: 'All current topics are completed. No incomplete topics to schedule.'
      };
    }

    // 5. Fetch Study Sessions for Inactivity Factor (recent history)
    const sessRes = await query(
      `SELECT topic_id, started_at
       FROM public.study_sessions
       WHERE user_id = $1 AND status = 'COMPLETED'
       ORDER BY started_at DESC;`,
      [userId]
    );

    // Build map of topicId -> most recent started_at
    const lastStudiedMap = new Map();
    for (const session of sessRes.rows) {
      if (session.topic_id && !lastStudiedMap.has(session.topic_id)) {
        lastStudiedMap.set(session.topic_id, session.started_at);
      }
    }

    // Map subjects by ID for instant lookup
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Exclude topics that are already active/completed in today's preserved plans
    const preservedTopicIds = new Set(preservedPlans.map(p => p.topic_id));
    const eligibleTopics = topics.filter(t => !preservedTopicIds.has(t.id));

    // 6. Score & Rank Candidates Deterministically
    const candidates = [];

    for (const topic of eligibleTopics) {
      const subject = subjectMap.get(topic.subject_id);
      if (!subject) continue;

      const urgency = calculateExamUrgency(subject.exam_date, planningDate);
      const completionNeed = calculateCompletionNeed(topic.completion_percentage);
      const difficulty = calculateDifficultyScore(topic.difficulty);
      const lastStudiedAt = lastStudiedMap.get(topic.id);
      const inactivity = calculateInactivityScore(lastStudiedAt, planningDate);

      const priority_score = calculatePriorityScore(urgency, completionNeed, difficulty, inactivity);
      const reason = generateReason({
        urgency,
        completionNeed,
        difficulty,
        inactivity,
        subjectName: subject.name,
        topicName: topic.name,
        examDateStr: subject.exam_date,
        planningDateStr: planningDate
      });

      candidates.push({
        subject_id: subject.id,
        topic_id: topic.id,
        subject_name: subject.name,
        topic_name: topic.name,
        color: subject.color,
        difficulty: topic.difficulty,
        completion_percentage: topic.completion_percentage,
        estimated_minutes: topic.estimated_minutes,
        exam_date: subject.exam_date,
        priority_score,
        reason,
        last_studied_at: lastStudiedAt
      });
    }

    // Deterministic Sorting:
    // 1. priority_score DESC
    // 2. exam_date ASC (nulls last)
    // 3. difficulty DESC
    // 4. estimated_minutes ASC
    // 5. topic_id ASC (consistent tie-break)
    candidates.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      if (a.exam_date && b.exam_date) {
        const diff = new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
        if (diff !== 0) return diff;
      } else if (a.exam_date && !b.exam_date) {
        return -1;
      } else if (!a.exam_date && b.exam_date) {
        return 1;
      }
      const diffA = calculateDifficultyScore(a.difficulty);
      const diffB = calculateDifficultyScore(b.difficulty);
      if (diffB !== diffA) return diffB - diffA;

      const estA = Number(a.estimated_minutes) || 45;
      const estB = Number(b.estimated_minutes) || 45;
      if (estA !== estB) return estA - estB;

      return String(a.topic_id).localeCompare(String(b.topic_id));
    });

    // 7. Allocate Tasks within Remaining Budget
    const allocated = allocateTasks(candidates, totalAvailableMinutes, preservedMinutes);

    // 8. Create Time Slots with Breaks
    const newPlans = createTimeSlots(allocated, planningDate, profile, preservedPlans);

    // 9. Validate Complete Combined Schedule
    const combinedPlans = [...preservedPlans, ...newPlans];
    const validation = validateSchedule(combinedPlans, totalAvailableMinutes);
    if (!validation.valid) {
      const err = new Error(`Schedule validation failed: ${validation.error}`);
      err.statusCode = 422;
      err.code = 'INVALID_SCHEDULE';
      throw err;
    }

    // 10. Persist Safe Plan Replacement:
    // Delete only RULE_ENGINE and PENDING/SKIPPED plans for this date.
    // Never delete COMPLETED or IN_PROGRESS plans!
    await query(
      `DELETE FROM public.study_plans
       WHERE user_id = $1 
         AND plan_date = $2 
         AND status = ANY($3::text[]) 
         AND source = $4;`,
      [userId, planningDate, [PLANNER_CONFIG.statuses.PENDING, PLANNER_CONFIG.statuses.SKIPPED], PLANNER_CONFIG.source]
    );

    // Insert newly generated plans if any
    let insertedPlans = [];
    if (newPlans.length > 0) {
      for (const p of newPlans) {
        const insertRes = await query(
          `INSERT INTO public.study_plans (
             user_id, subject_id, topic_id, plan_date, start_time, end_time,
             planned_minutes, priority_score, reason, status, source
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *;`,
          [
            userId, p.subject_id, p.topic_id, p.plan_date, p.start_time, p.end_time,
            p.planned_minutes, p.priority_score, p.reason, p.status, p.source
          ]
        );
        const insertedPlan = insertRes.rows[0];
        insertedPlan.subjects = { id: p.subject_id, name: p.subject_name, color: p.color };
        insertedPlan.topics = { id: p.topic_id, name: p.topic_name };
        insertedPlans.push(insertedPlan);
      }
    }

    // Combine preserved + newly inserted
    const finalPlans = [...preservedPlans, ...insertedPlans].sort(
      (a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime()
    );

    return this.formatPlanResponse(planningDate, finalPlans, profile);
  }

  /**
   * Retrieves the study plan for a specific date.
   */
  async getPlansByDate(userId, date) {
    const planningDate = date || new Date().toISOString().split('T')[0];

    // Fetch profile for available hours display
    const profileRes = await query(
      `SELECT id, daily_available_hours, preferred_study_start_time, preferred_study_end_time
       FROM public.profiles
       WHERE id = $1;`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    const plansRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC;`,
      [userId, planningDate]
    );

    return this.formatPlanResponse(planningDate, plansRes.rows || [], profile);
  }

  /**
   * Retrieves a 7-day weekly study plan overview.
   */
  async getWeeklyPlan(userId, startDateStr) {
    const startDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const plansRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1
         AND p.plan_date >= $2
         AND p.plan_date <= $3
       ORDER BY p.plan_date ASC, p.start_time ASC;`,
      [userId, startStr, endStr]
    );

    const plans = plansRes.rows || [];

    // Group plans by date across 7 days
    const grouped = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      grouped[key] = {
        date: key,
        total_planned_minutes: 0,
        completed_minutes: 0,
        pending_minutes: 0,
        plans: []
      };
    }

    for (const plan of plans) {
      // Ensure plan_date string in YYYY-MM-DD
      const d = typeof plan.plan_date === 'string'
        ? plan.plan_date.split('T')[0]
        : plan.plan_date.toISOString().split('T')[0];

      if (grouped[d]) {
        grouped[d].plans.push(plan);
        grouped[d].total_planned_minutes += plan.planned_minutes;
        if (plan.status === PLANNER_CONFIG.statuses.COMPLETED) {
          grouped[d].completed_minutes += plan.planned_minutes;
        } else if (plan.status === PLANNER_CONFIG.statuses.PENDING || plan.status === PLANNER_CONFIG.statuses.IN_PROGRESS) {
          grouped[d].pending_minutes += plan.planned_minutes;
        }
      }
    }

    return {
      start_date: startStr,
      end_date: endStr,
      days: Object.values(grouped)
    };
  }

  /**
   * Updates a study plan status following strict state machine transitions.
   */
  async updatePlanStatus(userId, planId, newStatus) {
    // 1. Fetch current plan and verify ownership
    const planRes = await query(
      `SELECT * FROM public.study_plans WHERE id = $1 AND user_id = $2;`,
      [planId, userId]
    );

    if (planRes.rows.length === 0) {
      const err = new Error('Study plan not found or access denied');
      err.statusCode = 404;
      err.code = 'PLAN_NOT_FOUND';
      throw err;
    }
    const plan = planRes.rows[0];

    // 2. Validate state transition
    const allowed = PLANNER_CONFIG.validStatusTransitions[plan.status] || [];
    if (!allowed.includes(newStatus)) {
      const err = new Error(`Invalid status transition from ${plan.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'None'}`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    // 3. Update status in database
    const updateRes = await query(
      `UPDATE public.study_plans
       SET status = $1, updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING *;`,
      [newStatus, planId, userId]
    );

    const updated = updateRes.rows[0];

    // Fetch relations for UI consistency
    const fullRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.id = $1;`,
      [updated.id]
    );

    return fullRes.rows[0];
  }

  /**
   * Formats response object with metrics.
   */
  formatPlanResponse(date, plans, profile) {
    let total_planned_minutes = 0;
    let completed_minutes = 0;
    let pending_minutes = 0;

    for (const p of plans) {
      const mins = Number(p.planned_minutes) || 0;
      total_planned_minutes += mins;
      if (p.status === PLANNER_CONFIG.statuses.COMPLETED) {
        completed_minutes += mins;
      } else if (p.status === PLANNER_CONFIG.statuses.PENDING || p.status === PLANNER_CONFIG.statuses.IN_PROGRESS) {
        pending_minutes += mins;
      }
    }

    const available_minutes = calculateAvailableMinutes(profile);

    return {
      date,
      available_minutes,
      total_planned_minutes,
      completed_minutes,
      pending_minutes,
      plans
    };
  }
}

export const plannerService = new PlannerService();
