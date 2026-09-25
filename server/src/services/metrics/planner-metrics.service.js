/**
 * planner-metrics.service.js
 *
 * Deterministic calculation engine for planned study workload vs. actual completed focus,
 * plan adherence percentages, task status distributions, and execution trends.
 */

import { getLocalDateString } from './study-metrics.service.js';

/**
 * Calculates comprehensive plan adherence and task execution metrics.
 *
 * @param {Array<Object>} plans - Array of study_plans records within the period
 * @param {Array<Object>} sessions - Array of study_sessions records within the period
 * @param {number} periodDays - Lookback window in calendar days
 * @param {string} timezone - Student timezone string
 * @param {string} [referenceDate] - Optional override for today's date
 * @returns {Object} Structured planner metrics
 */
export function calculatePlannerMetrics(plans = [], sessions = [], periodDays = 30, timezone = 'UTC', referenceDate = null) {
  const safePeriod = Math.max(1, Math.min(365, Number(periodDays) || 30));
  const todayStr = referenceDate || getLocalDateString(new Date(), timezone);

  let plannedMinutes = 0;
  const statusDistribution = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    MISSED: 0,
    SKIPPED: 0,
    PENDING: 0
  };

  const dailyPlansMap = new Map();

  for (const p of plans) {
    const mins = Math.max(0, Number(p.planned_minutes) || 0);
    plannedMinutes += mins;

    const st = (p.status || 'PENDING').toUpperCase();
    if (statusDistribution[st] !== undefined) {
      statusDistribution[st] += 1;
    } else {
      statusDistribution.PENDING += 1;
    }

    const planDate = p.plan_date
      ? (typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : getLocalDateString(p.plan_date, timezone))
      : null;

    if (planDate) {
      if (!dailyPlansMap.has(planDate)) {
        dailyPlansMap.set(planDate, { planned_minutes: 0, tasks_count: 0, completed_count: 0, missed_count: 0 });
      }
      const dayRec = dailyPlansMap.get(planDate);
      dayRec.planned_minutes += mins;
      dayRec.tasks_count += 1;
      if (st === 'COMPLETED') dayRec.completed_count += 1;
      if (st === 'MISSED') dayRec.missed_count += 1;
    }
  }

  // Calculate actual minutes from study sessions
  let actualMinutes = 0;
  const dailyActualMap = new Map();
  for (const s of sessions) {
    const mins = Math.max(0, Number(s.duration_minutes) || 0);
    actualMinutes += mins;

    const sessionDay = getLocalDateString(s.started_at, timezone);
    if (sessionDay) {
      dailyActualMap.set(sessionDay, (dailyActualMap.get(sessionDay) || 0) + mins);
    }
  }

  const differenceMinutes = actualMinutes - plannedMinutes;

  let adherencePercentage = 0;
  if (plannedMinutes > 0) {
    adherencePercentage = Math.min(100, Math.round((actualMinutes / plannedMinutes) * 100));
  } else if (actualMinutes > 0) {
    adherencePercentage = 100;
  } else {
    adherencePercentage = 0;
  }

  const totalPlannedTasks = plans.length;
  const completionRate = totalPlannedTasks > 0
    ? Math.round((statusDistribution.COMPLETED / totalPlannedTasks) * 100)
    : 0;

  const missRate = totalPlannedTasks > 0
    ? Math.round((statusDistribution.MISSED / totalPlannedTasks) * 100)
    : 0;

  // Build daily timeline
  const daily = [];
  const startD = new Date(todayStr + 'T00:00:00Z');
  startD.setUTCDate(startD.getUTCDate() - (safePeriod - 1));

  for (let i = 0; i < safePeriod; i++) {
    const cur = new Date(startD);
    cur.setUTCDate(cur.getUTCDate() + i);
    const dStr = cur.toISOString().split('T')[0];
    const planRec = dailyPlansMap.get(dStr) || { planned_minutes: 0, tasks_count: 0, completed_count: 0, missed_count: 0 };
    const dayActual = dailyActualMap.get(dStr) || 0;

    daily.push({
      date: dStr,
      planned_minutes: planRec.planned_minutes,
      actual_minutes: dayActual,
      tasks_count: planRec.tasks_count,
      completed_count: planRec.completed_count,
      missed_count: planRec.missed_count
    });
  }

  return {
    available: totalPlannedTasks > 0 || sessions.length > 0,
    planned_minutes: plannedMinutes,
    planned_hours: Number((plannedMinutes / 60).toFixed(1)),
    actual_minutes: actualMinutes,
    actual_hours: Number((actualMinutes / 60).toFixed(1)),
    difference_minutes: differenceMinutes,
    difference_hours: Number((differenceMinutes / 60).toFixed(1)),
    adherence_percentage: adherencePercentage,
    total_planned_tasks: totalPlannedTasks,
    status_distribution: statusDistribution,
    completion_rate: completionRate,
    miss_rate: missRate,
    daily
  };
}
