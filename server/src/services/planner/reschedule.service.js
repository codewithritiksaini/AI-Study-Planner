/**
 * reschedule.service.js
 *
 * Targeted adaptive rescheduling service for Phase 11.
 * Recovers missed study sessions by allocating their remaining work into the next
 * available study slot without wiping or cascading across the student's entire schedule.
 * Strictly preserves locked sessions.
 */

import { query } from '../../config/db.js';
import { schedulerConfig } from '../../config/scheduler.config.js';
import {
  generateAvailableSlots,
  timeStringToMinutes,
  minutesToTimeString
} from './slot.service.js';
import { calculateAdaptiveCapacity } from './capacity.service.js';
import { buildSchedulingContext } from './scheduling-context.service.js';

/**
 * Reschedules a missed study session to the next available suitable slot.
 *
 * @param {string} userId - UUID of the authenticated student
 * @param {string} sessionId - UUID of the study plan to reschedule
 * @param {Object} [options]
 * @param {string} [options.preferredDate] - Optional target date override (YYYY-MM-DD)
 * @returns {Promise<Object>} Reschedule result
 */
export async function rescheduleSession(userId, sessionId, options = {}) {
  // 1. Fetch the target study session
  const planRes = await query(
    `SELECT p.*, s.name AS subject_name, t.name AS topic_name
     FROM public.study_plans p
     LEFT JOIN public.subjects s ON p.subject_id = s.id
     LEFT JOIN public.topics t ON p.topic_id = t.id
     WHERE p.id = $1 AND p.user_id = $2;`,
    [sessionId, userId]
  );

  if (planRes.rows.length === 0) {
    const err = new Error('Study session not found.');
    err.statusCode = 404;
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }

  const session = planRes.rows[0];

  if (session.status === 'COMPLETED') {
    const err = new Error('Completed study sessions cannot be rescheduled.');
    err.statusCode = 400;
    err.code = 'CANNOT_RESCHEDULE_COMPLETED';
    throw err;
  }

  // 2. Mark original session as MISSED if not already
  if (session.status !== 'MISSED') {
    await query(
      `UPDATE public.study_plans
       SET status = 'MISSED', updated_at = now()
       WHERE id = $1 AND user_id = $2;`,
      [sessionId, userId]
    );
  }

  // 3. Build current scheduling context for lookahead
  const context = await buildSchedulingContext(userId, { lookbackDays: 14 });
  const today = context.today;
  const durationNeeded = Number(session.planned_minutes) || schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES;

  // 4. Search for next available slot starting tomorrow (or preferredDate) across next 7 days
  const searchStart = options.preferredDate || new Date(
    new Date(today + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  let allocatedSlot = null;
  const startDate = new Date(searchStart + 'T00:00:00Z');

  for (let offset = 0; offset < 7; offset++) {
    const candidateDate = new Date(startDate.getTime() + offset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch existing plans on this candidate date
    const dayPlansRes = await query(
      `SELECT * FROM public.study_plans
       WHERE user_id = $1 AND plan_date = $2 AND status != 'MISSED' AND status != 'SKIPPED';`,
      [userId, candidateDate]
    );
    const existingDayPlans = dayPlansRes.rows;

    // Locked or fixed sessions
    const lockedSessions = existingDayPlans.map((p) => ({
      plan_date: candidateDate,
      start_time: p.start_time,
      end_time: p.end_time,
      is_locked: true
    }));

    // Generate available free study windows
    const availableSlots = generateAvailableSlots({
      date: candidateDate,
      availability: context.availability,
      blockedPeriods: context.blocked_periods,
      lockedSessions: lockedSessions,
      minDuration: schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES
    });

    if (availableSlots.length === 0) continue;

    // Check capacity for candidate date
    const totalSlotMins = availableSlots.reduce((sum, s) => sum + s.duration_minutes, 0);
    const capacityInfo = calculateAdaptiveCapacity(context, totalSlotMins);
    const currentlyPlannedMins = existingDayPlans.reduce((sum, p) => sum + (Number(p.planned_minutes) || 0), 0);
    const remainingDayCapacity = Math.max(0, capacityInfo.schedulable_capacity_minutes - currentlyPlannedMins);

    if (remainingDayCapacity < schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES) {
      continue; // Day already packed
    }

    // Find first slot that can accommodate the needed duration
    for (const slot of availableSlots) {
      const slotCapacity = Math.min(slot.duration_minutes, remainingDayCapacity);
      if (slotCapacity >= schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES) {
        const actualDuration = Math.min(durationNeeded, slotCapacity);
        const startMins = slot.start_minutes;
        const endMins = startMins + actualDuration;

        allocatedSlot = {
          date: candidateDate,
          start_time: minutesToTimeString(startMins),
          end_time: minutesToTimeString(endMins),
          duration_minutes: actualDuration
        };
        break;
      }
    }

    if (allocatedSlot) break;
  }

  if (!allocatedSlot) {
    return {
      success: false,
      original_session_id: sessionId,
      status: 'UNSCHEDULED',
      reason: 'NO_OPEN_SLOT_AVAILABLE',
      message: 'Unable to find an open study slot within the next 7 days without exceeding your daily capacity limit.'
    };
  }

  // 5. Insert rescheduled session into public.study_plans
  const insertRes = await query(
    `INSERT INTO public.study_plans (
      user_id, subject_id, topic_id, plan_date, start_time, end_time,
      planned_minutes, priority_score, reason, status, is_locked,
      custom_title, task_source
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, 'PENDING', false,
      $10, 'BACKLOG'
    ) RETURNING *;`,
    [
      userId,
      session.subject_id,
      session.topic_id,
      allocatedSlot.date,
      `${allocatedSlot.date}T${allocatedSlot.start_time}:00Z`,
      `${allocatedSlot.date}T${allocatedSlot.end_time}:00Z`,
      allocatedSlot.duration_minutes,
      (Number(session.priority_score) || 50) + 5,
      `Rescheduled from missed session on ${session.plan_date}.`,
      session.custom_title || `Recover: ${session.topic_name || session.subject_name}`
    ]
  );

  return {
    success: true,
    original_session_id: sessionId,
    rescheduled_session: insertRes.rows[0],
    message: `Session successfully moved to ${allocatedSlot.date} at ${allocatedSlot.start_time} - ${allocatedSlot.end_time}.`
  };
}

export default {
  rescheduleSession
};
