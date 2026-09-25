/**
 * capacity.service.js
 *
 * Adaptive Capacity Calculator for Phase 11.
 * Determines realistic daily study capacity by synthesizing user preferences,
 * available slot minutes, rolling 14-day observed study averages, past plan adherence,
 * and safety elasticity buffers.
 */

import { schedulerConfig } from '../../config/scheduler.config.js';

/**
 * Calculates the realistic daily study capacity and schedulable minutes for a given day.
 *
 * @param {Object} context - SchedulingContext object from scheduling-context.service.js
 * @param {number} availableSlotMinutes - Total available free minutes on the given date
 * @returns {Object} Adaptive capacity breakdown
 */
export function calculateAdaptiveCapacity(context, availableSlotMinutes = 0) {
  const preferences = context.preferences || {};
  const metrics = context.historical_metrics || {};

  const declaredMax = preferences.max_daily_minutes || schedulerConfig.SESSION_BOUNDS.DEFAULT_MAX_DAILY_MINUTES;
  const availableBound = Math.min(declaredMax, Math.max(0, availableSlotMinutes));

  const totalSessions = metrics.total_sessions || 0;
  const observedDailyAvg = metrics.observed_daily_avg_minutes || 0;
  const adherenceRate = metrics.plan_adherence_rate || 0;

  let effectiveCapacity = availableBound;
  let isAdapted = false;
  let adaptationReason = 'Using declared daily availability.';

  // Apply adaptation only if sufficient historical sessions are logged (>= 3)
  if (totalSessions >= schedulerConfig.CAPACITY_ADAPTATION.MIN_SESSIONS_FOR_ADAPTATION && observedDailyAvg > 0) {
    let adaptedTarget = observedDailyAvg * schedulerConfig.CAPACITY_ADAPTATION.ELASTICITY_FACTOR;

    if (adherenceRate > 0 && adherenceRate < 50) {
      // Student is struggling with workload; de-escalate target by 15%
      adaptedTarget *= 0.85;
      adaptationReason = `Workload scaled down to match recent ${adherenceRate}% adherence rate.`;
    } else if (adherenceRate >= 80) {
      // High adherence; student comfortably handles workload
      adaptedTarget = Math.max(adaptedTarget, availableBound * 0.9);
      adaptationReason = `High adherence (${adherenceRate}%); capacity paced near target availability.`;
    } else {
      adaptationReason = `Paced based on observed ${Math.round(observedDailyAvg)}m daily average with 15% elasticity.`;
    }

    // Clamp between minimum floor and available bound
    const clampedTarget = Math.min(
      availableBound,
      Math.max(schedulerConfig.CAPACITY_ADAPTATION.MIN_CAPACITY_FLOOR_MINUTES, Math.round(adaptedTarget))
    );

    // If adapted target is meaningfully lower than declared bound, adopt it
    if (clampedTarget < availableBound) {
      effectiveCapacity = clampedTarget;
      isAdapted = true;
    }
  }

  // Calculate safety buffer (15% reserved for overrun / break tolerance, capped at 30 min)
  const safetyBuffer = Math.min(
    30,
    Math.round(effectiveCapacity * schedulerConfig.CAPACITY_ADAPTATION.SAFETY_BUFFER_RATIO)
  );

  const schedulableCapacity = Math.max(
    0,
    effectiveCapacity - safetyBuffer
  );

  return {
    declared_max_minutes: declaredMax,
    available_slot_minutes: availableSlotMinutes,
    observed_daily_avg_minutes: observedDailyAvg,
    effective_capacity_minutes: effectiveCapacity,
    safety_buffer_minutes: safetyBuffer,
    schedulable_capacity_minutes: schedulableCapacity,
    is_adapted: isAdapted,
    adherence_rate: adherenceRate,
    adaptation_reason: adaptationReason
  };
}

export default {
  calculateAdaptiveCapacity
};
