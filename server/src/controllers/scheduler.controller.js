/**
 * scheduler.controller.js
 *
 * REST API Controller for Phase 11 Intelligent Adaptive Study Scheduling:
 * - Daily and weekly timetable views
 * - Availability management
 * - Blocked periods management
 * - Non-destructive plan generation preview & transactional apply
 * - Session lock toggle and targeted missed session rescheduling
 * - Manual custom task scheduling
 */

import { query } from '../config/db.js';
import {
  availabilitySchema,
  blockedPeriodSchema,
  generatePlanPreviewSchema,
  applyPlanSchema,
  manualSessionSchema,
  uuidSchema
} from '../validators/scheduler.validator.js';
import { buildSchedulingContext } from '../services/planner/scheduling-context.service.js';
import { generateSchedule } from '../services/planner/scheduler.service.js';
import { generateAvailableSlots } from '../services/planner/slot.service.js';
import { calculateAdaptiveCapacity } from '../services/planner/capacity.service.js';
import { rescheduleSession } from '../services/planner/reschedule.service.js';
import {
  generateSessionExplanation,
  generatePlanExplanation
} from '../services/planner/plan-explanation.service.js';
import { schedulerConfig } from '../config/scheduler.config.js';

/**
 * GET /api/planner/daily
 * Retrieves time-aware schedule for a specific date (defaults to today).
 */
export async function getDailyPlan(req, res, next) {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const context = await buildSchedulingContext(userId, { periodStart: date, periodEnd: date });

    // Fetch plans on this date
    const plansRes = await query(
      `SELECT p.*, s.name AS subject_name, s.color AS subject_color, t.name AS topic_name
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC NULLS LAST;`,
      [userId, date]
    );

    // Get available slots
    const availableSlots = generateAvailableSlots({
      date,
      availability: context.availability,
      blockedPeriods: context.blocked_periods,
      lockedSessions: plansRes.rows.filter((p) => p.is_locked),
      minDuration: context.preferences.min_session_minutes
    });

    const totalAvailableMins = availableSlots.reduce((sum, s) => sum + s.duration_minutes, 0);
    const capacityInfo = calculateAdaptiveCapacity(context, totalAvailableMins);

    // Format sessions with explanation bullets
    const sessions = plansRes.rows.map((p) => {
      const startTimeStr = typeof p.start_time === 'string' && p.start_time.includes('T')
        ? p.start_time.substring(11, 16)
        : p.start_time;
      const endTimeStr = typeof p.end_time === 'string' && p.end_time.includes('T')
        ? p.end_time.substring(11, 16)
        : p.end_time;

      const explanation = generateSessionExplanation({
        ...p,
        duration_minutes: p.planned_minutes,
        start_time: startTimeStr,
        end_time: endTimeStr,
        task_source: p.task_source
      }, context);

      return {
        id: p.id,
        subject_id: p.subject_id,
        subject_name: p.subject_name || 'General Subject',
        subject_color: p.subject_color || '#4f46e5',
        topic_id: p.topic_id,
        topic_name: p.topic_name || p.custom_title,
        custom_title: p.custom_title,
        plan_date: date,
        start_time: startTimeStr,
        end_time: endTimeStr,
        planned_minutes: p.planned_minutes,
        priority_score: p.priority_score,
        status: p.status,
        is_locked: p.is_locked,
        task_source: p.task_source,
        reason: p.reason,
        explanation
      };
    });

    const plannedMinutes = sessions.reduce((sum, s) => sum + (Number(s.planned_minutes) || 0), 0);
    const freeBufferMinutes = Math.max(0, totalAvailableMins - plannedMinutes);

    return res.status(200).json({
      success: true,
      data: {
        date,
        available_minutes: totalAvailableMins,
        planned_minutes: plannedMinutes,
        free_buffer_minutes: freeBufferMinutes,
        effective_capacity_minutes: capacityInfo.effective_capacity_minutes,
        safety_buffer_minutes: capacityInfo.safety_buffer_minutes,
        sessions,
        slots: availableSlots,
        overloaded: plannedMinutes > totalAvailableMins
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/planner/weekly
 * Retrieves multi-day timetable with daily distributions.
 */
export async function getWeeklyPlan(req, res, next) {
  try {
    const userId = req.user.id;
    const startDateStr = req.query.startDate || new Date().toISOString().split('T')[0];

    const startDate = new Date(startDateStr + 'T00:00:00Z');
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().split('T')[0];

    const context = await buildSchedulingContext(userId, {
      periodStart: startDateStr,
      periodEnd: endDateStr
    });

    // Fetch all plans in the week
    const plansRes = await query(
      `SELECT p.*, s.name AS subject_name, s.color AS subject_color, t.name AS topic_name
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date >= $2 AND p.plan_date <= $3
       ORDER BY p.plan_date ASC, p.start_time ASC NULLS LAST;`,
      [userId, startDateStr, endDateStr]
    );

    const plansByDate = {};
    for (const p of plansRes.rows) {
      const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : new Date(p.plan_date).toISOString().split('T')[0];
      if (!plansByDate[pDate]) plansByDate[pDate] = [];
      plansByDate[pDate].push(p);
    }

    const days = [];
    const subjectDistribution = {};
    let totalPlannedMinutes = 0;

    for (let d = 0; d < 7; d++) {
      const curDateStr = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayPlans = plansByDate[curDateStr] || [];

      const availableSlots = generateAvailableSlots({
        date: curDateStr,
        availability: context.availability,
        blockedPeriods: context.blocked_periods,
        lockedSessions: dayPlans.filter((p) => p.is_locked),
        minDuration: context.preferences.min_session_minutes
      });

      const dayAvailableMins = availableSlots.reduce((sum, s) => sum + s.duration_minutes, 0);
      const dayPlannedMins = dayPlans.reduce((sum, p) => sum + (Number(p.planned_minutes) || 0), 0);

      totalPlannedMinutes += dayPlannedMins;

      for (const p of dayPlans) {
        const subName = p.subject_name || 'General';
        subjectDistribution[subName] = (subjectDistribution[subName] || 0) + (Number(p.planned_minutes) || 0);
      }

      days.push({
        date: curDateStr,
        day_of_week: new Date(curDateStr + 'T00:00:00Z').getUTCDay(),
        available_minutes: dayAvailableMins,
        planned_minutes: dayPlannedMins,
        sessions_count: dayPlans.length,
        sessions: dayPlans.map((p) => ({
          id: p.id,
          subject_id: p.subject_id,
          subject_name: p.subject_name || 'General Subject',
          subject_color: p.subject_color || '#4f46e5',
          topic_id: p.topic_id,
          topic_name: p.topic_name || p.custom_title,
          custom_title: p.custom_title,
          start_time: typeof p.start_time === 'string' && p.start_time.includes('T') ? p.start_time.substring(11, 16) : p.start_time,
          end_time: typeof p.end_time === 'string' && p.end_time.includes('T') ? p.end_time.substring(11, 16) : p.end_time,
          planned_minutes: p.planned_minutes,
          priority_score: p.priority_score,
          status: p.status,
          is_locked: p.is_locked,
          task_source: p.task_source
        }))
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        week_start: startDateStr,
        week_end: endDateStr,
        days,
        total_planned_minutes: totalPlannedMinutes,
        subject_distribution: subjectDistribution
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/planner/availability
 */
export async function getAvailability(req, res, next) {
  try {
    const userId = req.user.id;
    const availRes = await query(
      `SELECT * FROM public.study_availability
       WHERE user_id = $1
       ORDER BY day_of_week ASC, start_time ASC;`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        availability: availRes.rows.length > 0 ? availRes.rows : schedulerConfig.DEFAULT_AVAILABILITY
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/availability
 */
export async function createAvailability(req, res, next) {
  try {
    const userId = req.user.id;
    const val = availabilitySchema.parse(req.body);

    const insertRes = await query(
      `INSERT INTO public.study_availability (user_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [userId, val.day_of_week, val.start_time, val.end_time, val.is_active ?? true]
    );

    return res.status(201).json({
      success: true,
      data: { availability: insertRes.rows[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/planner/availability/:id
 */
export async function updateAvailability(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);
    const val = availabilitySchema.parse(req.body);

    const updateRes = await query(
      `UPDATE public.study_availability
       SET day_of_week = $1, start_time = $2, end_time = $3, is_active = $4, updated_at = now()
       WHERE id = $5 AND user_id = $6
       RETURNING *;`,
      [val.day_of_week, val.start_time, val.end_time, val.is_active, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Availability slot not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: { availability: updateRes.rows[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/planner/availability/:id
 */
export async function deleteAvailability(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);

    const delRes = await query(
      `DELETE FROM public.study_availability WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Availability slot not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: { id, message: 'Availability slot deleted.' }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/planner/blocked-periods
 */
export async function getBlockedPeriods(req, res, next) {
  try {
    const userId = req.user.id;
    const blockedRes = await query(
      `SELECT * FROM public.blocked_periods
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { blocked_periods: blockedRes.rows }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/blocked-periods
 */
export async function createBlockedPeriod(req, res, next) {
  try {
    const userId = req.user.id;
    const val = blockedPeriodSchema.parse(req.body);

    const insertRes = await query(
      `INSERT INTO public.blocked_periods (user_id, day_of_week, date, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [userId, val.day_of_week ?? null, val.date ?? null, val.start_time, val.end_time, val.reason ?? null]
    );

    return res.status(201).json({
      success: true,
      data: { blocked_period: insertRes.rows[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/planner/blocked-periods/:id
 */
export async function deleteBlockedPeriod(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);

    const delRes = await query(
      `DELETE FROM public.blocked_periods WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Blocked period not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: { id, message: 'Blocked period deleted.' }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/generate
 * Non-destructive plan preview generator.
 */
export async function generatePlanPreview(req, res, next) {
  try {
    const userId = req.user.id;
    const val = generatePlanPreviewSchema.parse(req.body);

    const context = await buildSchedulingContext(userId, {
      periodStart: val.period_start,
      periodEnd: val.period_end
    });

    const scheduleResult = generateSchedule(context);
    const explanation = await generatePlanExplanation(scheduleResult, context, {
      useAI: val.include_ai_explanation ?? true
    });

    // Save lightweight plan generation record
    const genRes = await query(
      `INSERT INTO public.plan_generations (
        user_id, period_start, period_end, algorithm_version,
        total_planned_minutes, available_minutes, overloaded, generation_metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id, period_start, period_end, algorithm_version, created_at;`,
      [
        userId,
        context.period.start,
        context.period.end,
        scheduleResult.algorithm_version,
        scheduleResult.total_planned_minutes,
        scheduleResult.total_available_minutes,
        scheduleResult.overloaded,
        JSON.stringify({
          sessions: scheduleResult.sessions,
          unscheduled_tasks: scheduleResult.unscheduled_tasks,
          overload_details: scheduleResult.overload_details,
          explanation
        })
      ]
    );

    return res.status(200).json({
      success: true,
      data: {
        generation_id: genRes.rows[0].id,
        period_start: context.period.start,
        period_end: context.period.end,
        preview: scheduleResult,
        explanation
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/apply
 * Transactionally applies and persists generated plan sessions.
 */
export async function applyPlan(req, res, next) {
  try {
    const userId = req.user.id;
    const val = applyPlanSchema.parse(req.body);

    // Fetch generation record
    const genRes = await query(
      `SELECT * FROM public.plan_generations WHERE id = $1 AND user_id = $2;`,
      [val.generation_id, userId]
    );

    if (genRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Plan generation snapshot not found.' } });
    }

    const generation = genRes.rows[0];
    const metadata = generation.generation_metadata || {};
    const sessions = metadata.sessions || [];

    const periodStart = generation.period_start;
    const periodEnd = generation.period_end;

    // 1. Remove only future unlocked generated pending sessions within the period
    await query(
      `DELETE FROM public.study_plans
       WHERE user_id = $1 
         AND plan_date >= $2 
         AND plan_date <= $3
         AND is_locked = false 
         AND status = 'PENDING';`,
      [userId, periodStart, periodEnd]
    );

    // 2. Insert new generated sessions
    let insertedCount = 0;
    for (const s of sessions) {
      if (s.is_locked) continue; // Locked sessions are already in DB

      const startTimeStr = s.start_time ? `${s.date}T${s.start_time}:00Z` : null;
      const endTimeStr = s.end_time ? `${s.date}T${s.end_time}:00Z` : null;

      await query(
        `INSERT INTO public.study_plans (
          user_id, subject_id, topic_id, plan_date, start_time, end_time,
          planned_minutes, priority_score, reason, status, is_locked,
          generation_id, custom_title, task_source
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', false, $10, $11, $12
        );`,
        [
          userId,
          s.subject_id || null,
          s.topic_id || null,
          s.date,
          startTimeStr,
          endTimeStr,
          s.duration_minutes,
          s.priority_score || 50,
          s.reason || 'Smart Study Plan',
          generation.id,
          s.custom_title || s.topic_name,
          s.task_source || 'PLANNER'
        ]
      );
      insertedCount++;
    }

    return res.status(200).json({
      success: true,
      data: {
        generation_id: generation.id,
        sessions_created: insertedCount,
        message: `Plan applied successfully! ${insertedCount} study session(s) scheduled.`
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/sessions/:id/lock
 * Toggles locked status of a study plan session.
 */
export async function toggleSessionLock(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);

    const updateRes = await query(
      `UPDATE public.study_plans
       SET is_locked = NOT is_locked, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_locked;`,
      [id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Study session not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updateRes.rows[0].id,
        is_locked: updateRes.rows[0].is_locked,
        message: updateRes.rows[0].is_locked ? 'Session locked.' : 'Session unlocked.'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/sessions/:id/reschedule
 * Recovers a missed session by finding the next suitable open slot.
 */
export async function handleRescheduleSession(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);

    const result = await rescheduleSession(userId, id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/planner/sessions
 * Creates a manual custom study session.
 */
export async function createManualSession(req, res, next) {
  try {
    const userId = req.user.id;
    const val = manualSessionSchema.parse(req.body);

    const startTimeStr = `${val.date}T${val.start_time}:00Z`;
    const endTimeStr = `${val.date}T${val.end_time}:00Z`;

    const insertRes = await query(
      `INSERT INTO public.study_plans (
        user_id, subject_id, topic_id, plan_date, start_time, end_time,
        planned_minutes, priority_score, reason, status, is_locked,
        custom_title, task_source
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 80, 'Manually scheduled by student',
        'PENDING', $8, $9, 'MANUAL'
      ) RETURNING *;`,
      [
        userId,
        val.subject_id || null,
        val.topic_id || null,
        val.date,
        startTimeStr,
        endTimeStr,
        val.planned_minutes,
        val.is_locked ?? true,
        val.custom_title
      ]
    );

    return res.status(201).json({
      success: true,
      data: { session: insertRes.rows[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/planner/sessions/:id
 */
export async function deleteSession(req, res, next) {
  try {
    const userId = req.user.id;
    const id = uuidSchema.parse(req.params.id);

    const delRes = await query(
      `DELETE FROM public.study_plans WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Study session not found.' } });
    }

    return res.status(200).json({
      success: true,
      data: { id, message: 'Session deleted successfully.' }
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getDailyPlan,
  getWeeklyPlan,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getBlockedPeriods,
  createBlockedPeriod,
  deleteBlockedPeriod,
  generatePlanPreview,
  applyPlan,
  toggleSessionLock,
  handleRescheduleSession,
  createManualSession,
  deleteSession
};
