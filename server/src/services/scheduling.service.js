import { PLANNER_CONFIG } from '../config/planner.config.js';

/**
 * Pure Scheduling Domain Service
 * Handles capacity calculation, task duration allocation, time-slot placement,
 * break insertion, and overlap validation.
 */

/**
 * 1. Calculate Available Study Minutes
 * Based on student profile: daily_available_hours and preferred study window.
 */
export function calculateAvailableMinutes(profile) {
  const { scheduling } = PLANNER_CONFIG;

  const rawHours = Number(profile?.daily_available_hours);
  const hours = (!isNaN(rawHours) && rawHours > 0) ? rawHours : scheduling.defaultDailyAvailableHours;
  const maxMinutesByHours = Math.round(hours * 60);

  // Parse study window
  const startTimeStr = profile?.preferred_study_start_time || scheduling.defaultStudyStartTime;
  const endTimeStr = profile?.preferred_study_end_time || scheduling.defaultStudyEndTime;

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  let windowMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (windowMinutes <= 0) {
    // Wrapped around midnight or invalid, default to 4-hour window
    windowMinutes = 240;
  }

  // The actual available study minutes is capped by both daily available hours and study window size
  return Math.min(maxMinutesByHours, windowMinutes);
}

/**
 * 2. Allocate Tasks within Available Minutes
 * Given sorted candidate topics and available minutes:
 * - Selects top candidates.
 * - Caps task duration to maxStudyBlockMinutes (90m).
 * - Enforces minStudyBlockMinutes (25m).
 * - Does not overschedule availableMinutes.
 */
export function allocateTasks(rankedCandidates, availableMinutes, existingPlannedMinutes = 0) {
  const { scheduling } = PLANNER_CONFIG;
  let remainingBudget = availableMinutes - existingPlannedMinutes;

  if (remainingBudget < scheduling.minStudyBlockMinutes) {
    return [];
  }

  const allocated = [];

  for (const candidate of rankedCandidates) {
    if (remainingBudget < scheduling.minStudyBlockMinutes) {
      break;
    }

    // Determine target duration for this candidate
    const rawEstimated = Number(candidate.estimated_minutes) || scheduling.defaultTopicDurationMinutes;
    // Calculate remaining minutes for topic based on completion percentage
    const completion = Number(candidate.completion_percentage) || 0;
    const remainingTopicMinutes = Math.max(
      scheduling.minStudyBlockMinutes,
      Math.round(rawEstimated * (1 - completion / 100))
    );

    // Block cannot exceed maxStudyBlockMinutes (90m) or remaining budget
    let blockMinutes = Math.min(remainingTopicMinutes, scheduling.maxStudyBlockMinutes);
    blockMinutes = Math.min(blockMinutes, remainingBudget);

    // If remaining budget after capping would leave an unusable sliver (< minStudyBlockMinutes),
    // and candidate can absorb it up to maxStudyBlockMinutes, expand it, or just use blockMinutes.
    if (blockMinutes >= scheduling.minStudyBlockMinutes) {
      allocated.push({
        ...candidate,
        planned_minutes: blockMinutes
      });
      remainingBudget -= blockMinutes;
    }
  }

  return allocated;
}

/**
 * 3. Create Time Slots with Breaks
 * Places allocated tasks sequentially inside the user's preferred study window.
 * Automatically inserts a 10m break after blocks >= 50m.
 */
export function createTimeSlots(allocatedTasks, planningDateStr, profile, existingPlans = []) {
  const { scheduling } = PLANNER_CONFIG;

  const startTimeStr = profile?.preferred_study_start_time || scheduling.defaultStudyStartTime;
  const [startH, startM] = startTimeStr.split(':').map(Number);

  // Base calendar date for planning date
  const [year, month, day] = planningDateStr.split('-').map(Number);

  // Track the next available start time cursor
  let currentCursor = new Date(Date.UTC(year, month - 1, day, startH, startM, 0, 0));

  // If there are existing plans for today, start after the latest existing end_time
  if (existingPlans && existingPlans.length > 0) {
    const latestExistingEnd = existingPlans
      .filter(p => p.end_time)
      .map(p => new Date(p.end_time))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (latestExistingEnd && latestExistingEnd.getTime() > currentCursor.getTime()) {
      currentCursor = new Date(latestExistingEnd.getTime() + scheduling.breakDurationMinutes * 60 * 1000);
    }
  }

  const scheduledPlans = [];

  for (let i = 0; i < allocatedTasks.length; i++) {
    const task = allocatedTasks[i];
    const durationMs = task.planned_minutes * 60 * 1000;

    const slotStart = new Date(currentCursor.getTime());
    const slotEnd = new Date(slotStart.getTime() + durationMs);

    scheduledPlans.push({
      subject_id: task.subject_id,
      topic_id: task.topic_id,
      plan_date: planningDateStr,
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      planned_minutes: task.planned_minutes,
      priority_score: task.priority_score,
      reason: task.reason,
      status: PLANNER_CONFIG.statuses.PENDING,
      source: PLANNER_CONFIG.source,
      // Pass-through metadata for UI previews
      subject_name: task.subject_name,
      topic_name: task.topic_name,
      color: task.color
    });

    // Advance cursor for next task: add break if this task was >= breakIntervalMinutes
    const breakMs = task.planned_minutes >= scheduling.breakIntervalMinutes
      ? scheduling.breakDurationMinutes * 60 * 1000
      : 0;

    currentCursor = new Date(slotEnd.getTime() + breakMs);
  }

  return scheduledPlans;
}

/**
 * 4. Validate Schedule
 * Enforces:
 * - planned_minutes > 0
 * - start_time < end_time
 * - zero overlapping time slots among all plans
 * - total planned minutes <= available capacity
 */
export function validateSchedule(plans, availableMinutes) {
  if (!Array.isArray(plans)) {
    return { valid: false, error: 'Schedule must be an array of plans' };
  }

  let totalMinutes = 0;

  // Check each plan's internal validity
  for (const plan of plans) {
    if (!plan.planned_minutes || plan.planned_minutes <= 0) {
      return { valid: false, error: `Invalid planned minutes: ${plan.planned_minutes}` };
    }
    totalMinutes += plan.planned_minutes;

    if (plan.start_time && plan.end_time) {
      const start = new Date(plan.start_time).getTime();
      const end = new Date(plan.end_time).getTime();
      if (start >= end) {
        return { valid: false, error: `start_time must be before end_time for topic ${plan.topic_id}` };
      }
    }
  }

  // Check total planned duration does not overschedule
  if (availableMinutes && totalMinutes > availableMinutes) {
    return {
      valid: false,
      error: `Total planned time (${totalMinutes}m) exceeds available study capacity (${availableMinutes}m)`
    };
  }

  // Check for any pairwise time overlaps
  const timedPlans = plans
    .filter(p => p.start_time && p.end_time)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  for (let i = 0; i < timedPlans.length - 1; i++) {
    const current = timedPlans[i];
    const next = timedPlans[i + 1];

    const currentEnd = new Date(current.end_time).getTime();
    const nextStart = new Date(next.start_time).getTime();

    if (currentEnd > nextStart) {
      return {
        valid: false,
        error: `Overlapping schedule detected between ${current.topic_id} and ${next.topic_id}`
      };
    }
  }

  return { valid: true };
}
