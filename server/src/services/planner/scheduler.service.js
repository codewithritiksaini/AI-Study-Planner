/**
 * scheduler.service.js
 *
 * Pure deterministic scheduling engine for Phase 11.
 * Converts Phase 10 recommendations, curriculum topics, exam urgencies,
 * and student availability into an optimized, time-aware daily/weekly study plan.
 *
 * Core Features:
 * - Candidate normalization from multiple sources (RECOMMENDATION, PLANNER, BACKLOG, MANUAL, EXAM)
 * - Prerequisite dependency graph checking (topic_prerequisites)
 * - Capacity-aware task splitting (20 - 90 min) avoiding unusable fragments
 * - Multi-day slot allocation respecting available study windows and breaks
 * - Subject diversity enforcement (avoiding monotone subject clusters)
 * - Transparent overload detection (shortfall calculation and unscheduled task auditing)
 */

import { schedulerConfig } from '../../config/scheduler.config.js';
import {
  generateAvailableSlots,
  timeStringToMinutes,
  minutesToTimeString
} from './slot.service.js';
import { calculateAdaptiveCapacity } from './capacity.service.js';

/**
 * Normalizes candidates from recommendations, topics, exams, and backlog into a unified schema.
 *
 * @param {Object} context - SchedulingContext
 * @returns {Array<Object>} Normalized task candidates
 */
export function normalizeCandidates(context) {
  const candidates = [];
  const existingTopicIds = new Set();

  const subjectsMap = new Map((context.subjects || []).map((s) => [s.id, s]));
  const topicsMap = new Map((context.topics || []).map((t) => [t.id, t]));

  // 1. Process Active Recommendations from Phase 10 (Highest priority source)
  for (const rec of context.recommendations || []) {
    const subject = subjectsMap.get(rec.subject_id) || {};
    const topic = topicsMap.get(rec.topic_id) || {};

    let estimatedMinutes = Number(rec.estimated_minutes) || schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES;
    estimatedMinutes = Math.max(schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES, Math.min(240, estimatedMinutes));

    let basePriority = Number(rec.priority_score) || (rec.priority === 'HIGH' ? 80 : rec.priority === 'MEDIUM' ? 50 : 30);

    // Apply exam urgency adjustment
    if (subject.days_until_exam !== null && subject.days_until_exam !== undefined) {
      if (subject.days_until_exam <= schedulerConfig.DEADLINE_URGENCY.CRITICAL_DAYS) {
        basePriority += 25;
      } else if (subject.days_until_exam <= schedulerConfig.DEADLINE_URGENCY.HIGH_DAYS) {
        basePriority += 15;
      } else if (subject.days_until_exam <= schedulerConfig.DEADLINE_URGENCY.MODERATE_DAYS) {
        basePriority += 5;
      }
    }

    candidates.push({
      id: rec.id,
      source: schedulerConfig.TASK_SOURCES.RECOMMENDATION,
      type: rec.type,
      subject_id: rec.subject_id,
      subject_name: subject.name || 'General Subject',
      subject_color: subject.color || '#4f46e5',
      topic_id: rec.topic_id,
      topic_name: topic.name || rec.title,
      custom_title: rec.title,
      estimated_minutes: estimatedMinutes,
      priority_score: basePriority,
      priority: basePriority >= 65 ? 'HIGH' : basePriority >= 40 ? 'MEDIUM' : 'LOW',
      reason: rec.message || rec.title,
      days_until_exam: subject.days_until_exam,
      prerequisites: topic.prerequisites || []
    });

    if (rec.topic_id) {
      existingTopicIds.add(rec.topic_id);
    }
  }

  // 2. Process Unfinished Syllabus Topics not already recommended
  for (const topic of context.topics || []) {
    if (topic.is_completed || existingTopicIds.has(topic.id)) {
      continue;
    }

    const subject = subjectsMap.get(topic.subject_id) || {};
    const remainingMins = topic.remaining_work_minutes > 0
      ? topic.remaining_work_minutes
      : schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES;

    let baseScore = 35; // Standard base for incomplete syllabus work
    if (subject.is_exam_urgent) {
      baseScore += 25;
    }
    if (topic.difficulty === 'HARD') {
      baseScore += 10;
    }

    candidates.push({
      id: `topic-${topic.id}`,
      source: subject.is_exam_urgent ? schedulerConfig.TASK_SOURCES.EXAM : schedulerConfig.TASK_SOURCES.PLANNER,
      type: 'UNFINISHED_TOPIC',
      subject_id: topic.subject_id,
      subject_name: subject.name || topic.subject_name,
      subject_color: subject.color || topic.subject_color || '#4f46e5',
      topic_id: topic.id,
      topic_name: topic.name,
      custom_title: `Study ${topic.name}`,
      estimated_minutes: Math.max(schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES, remainingMins),
      priority_score: baseScore,
      priority: baseScore >= 65 ? 'HIGH' : baseScore >= 40 ? 'MEDIUM' : 'LOW',
      reason: subject.is_exam_urgent
        ? `Exam in ${subject.days_until_exam} days; ${topic.remaining_percentage}% syllabus remaining.`
        : `Continue syllabus topic (${topic.remaining_percentage}% remaining).`,
      days_until_exam: subject.days_until_exam,
      prerequisites: topic.prerequisites || []
    });

    existingTopicIds.add(topic.id);
  }

  // 3. Process Missed Plan Backlog
  for (const back of context.backlog || []) {
    if (back.topic_id && existingTopicIds.has(back.topic_id)) {
      continue;
    }

    const subject = subjectsMap.get(back.subject_id) || {};
    candidates.push({
      id: `backlog-${back.id}`,
      source: schedulerConfig.TASK_SOURCES.BACKLOG,
      type: 'BACKLOG',
      subject_id: back.subject_id,
      subject_name: subject.name || back.subject_name,
      subject_color: subject.color || '#4f46e5',
      topic_id: back.topic_id,
      topic_name: back.topic_name || 'Missed Study Session',
      custom_title: `Recover: ${back.topic_name || 'Study Task'}`,
      estimated_minutes: Number(back.planned_minutes) || schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES,
      priority_score: (Number(back.priority_score) || 40) + 10, // Slight urgency boost for recovery
      priority: 'MEDIUM',
      reason: `Missed from previous study plan (${back.plan_date}).`,
      days_until_exam: subject.days_until_exam,
      prerequisites: []
    });
  }

  return candidates;
}

/**
 * Splits oversized tasks (> MAX_SESSION_MINUTES) into cognitive study chunks (20m - 90m).
 *
 * @param {Object} candidate - Candidate task
 * @param {number} preferredMins - Preferred session length (e.g. 45m)
 * @param {number} maxMins - Max session length (e.g. 90m)
 * @param {number} minMins - Min session length (e.g. 20m)
 * @returns {Array<Object>} Array of sub-task chunks
 */
export function splitTask(candidate, preferredMins = 45, maxMins = 90, minMins = 20) {
  const totalMinutes = candidate.estimated_minutes;

  // If task comfortably fits in a single session, do not split
  if (totalMinutes <= maxMins) {
    return [{ ...candidate, chunk_index: 1, total_chunks: 1 }];
  }

  const chunks = [];
  let remaining = totalMinutes;
  let chunkIndex = 1;

  while (remaining > 0) {
    if (remaining <= preferredMins) {
      chunks.push({
        ...candidate,
        id: `${candidate.id}-part${chunkIndex}`,
        custom_title: `${candidate.custom_title || candidate.topic_name} (Part ${chunkIndex})`,
        estimated_minutes: remaining,
        chunk_index: chunkIndex,
        is_split: true
      });
      break;
    }

    const leftover = remaining - preferredMins;

    if (leftover < minMins) {
      if (remaining <= maxMins) {
        chunks.push({
          ...candidate,
          id: `${candidate.id}-part${chunkIndex}`,
          custom_title: `${candidate.custom_title || candidate.topic_name} (Part ${chunkIndex})`,
          estimated_minutes: remaining,
          chunk_index: chunkIndex,
          is_split: true
        });
        break;
      } else {
        const half = Math.floor(remaining / 2);
        chunks.push({
          ...candidate,
          id: `${candidate.id}-part${chunkIndex}`,
          custom_title: `${candidate.custom_title || candidate.topic_name} (Part ${chunkIndex})`,
          estimated_minutes: half,
          chunk_index: chunkIndex,
          is_split: true
        });
        remaining -= half;
        chunkIndex++;
        continue;
      }
    }

    chunks.push({
      ...candidate,
      id: `${candidate.id}-part${chunkIndex}`,
      custom_title: `${candidate.custom_title || candidate.topic_name} (Part ${chunkIndex})`,
      estimated_minutes: preferredMins,
      chunk_index: chunkIndex,
      is_split: true
    });
    remaining -= preferredMins;
    chunkIndex++;
  }

  chunks.forEach((c) => (c.total_chunks = chunks.length));
  return chunks;
}

/**
 * Checks prerequisite topic completion status.
 *
 * @param {Object} task - Candidate task
 * @param {Map<string, Object>} topicsMap - Map of all curriculum topics
 * @returns {boolean} True if all prerequisites are completed
 */
export function isPrerequisiteComplete(task, topicsMap) {
  if (!task.prerequisites || task.prerequisites.length === 0) {
    return true;
  }
  for (const prereqId of task.prerequisites) {
    const prereq = topicsMap.get(prereqId);
    if (!prereq || !prereq.is_completed) {
      return false;
    }
  }
  return true;
}

/**
 * Core pure deterministic schedule generator.
 *
 * @param {Object} context - SchedulingContext
 * @returns {Object} ScheduleResult
 */
export function generateSchedule(context) {
  const periodStart = context.period.start;
  const periodEnd = context.period.end;

  const topicsMap = new Map((context.topics || []).map((t) => [t.id, t]));
  const rawCandidates = normalizeCandidates(context);

  // 1. Separate candidates with incomplete prerequisites
  const schedulableCandidates = [];
  const unscheduledTasks = [];

  for (const candidate of rawCandidates) {
    if (!isPrerequisiteComplete(candidate, topicsMap)) {
      unscheduledTasks.push({
        ...candidate,
        unscheduled_reason: 'PREREQUISITE_INCOMPLETE',
        reason_explanation: 'Topic has incomplete prerequisite topics in syllabus.'
      });
    } else {
      schedulableCandidates.push(candidate);
    }
  }

  // 2. Sort schedulable candidates by priority score descending (higher priority first)
  schedulableCandidates.sort((a, b) => b.priority_score - a.priority_score);

  // 3. Expand tasks with splitting
  const taskChunks = [];
  for (const candidate of schedulableCandidates) {
    const parts = splitTask(
      candidate,
      context.preferences.preferred_session_minutes,
      context.preferences.max_session_minutes,
      context.preferences.min_session_minutes
    );
    taskChunks.push(...parts);
  }

  // 4. Generate daily slots and track capacity across the planning period
  const startDate = new Date(periodStart + 'T00:00:00Z');
  const endDate = new Date(periodEnd + 'T00:00:00Z');
  const dayCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);

  const scheduledSessions = [];
  const dailyBreakdown = {};
  const subjectDistribution = {};

  let remainingTasks = [...taskChunks];

  for (let d = 0; d < dayCount; d++) {
    const currentDate = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get locked sessions for this day
    const lockedOnDay = (context.existing_plans || []).filter((p) => {
      const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : new Date(p.plan_date).toISOString().split('T')[0];
      return pDate === currentDate && p.is_locked;
    });

    // Generate available free study windows
    const availableSlots = generateAvailableSlots({
      date: currentDate,
      availability: context.availability,
      blockedPeriods: context.blocked_periods,
      lockedSessions: lockedOnDay,
      minDuration: context.preferences.min_session_minutes
    });

    const totalAvailableMins = availableSlots.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Calculate adaptive capacity
    const capacityInfo = calculateAdaptiveCapacity(context, totalAvailableMins);
    let dayBudgetRemaining = capacityInfo.schedulable_capacity_minutes;

    dailyBreakdown[currentDate] = {
      date: currentDate,
      available_minutes: totalAvailableMins,
      effective_capacity_minutes: capacityInfo.effective_capacity_minutes,
      schedulable_capacity_minutes: capacityInfo.schedulable_capacity_minutes,
      safety_buffer_minutes: capacityInfo.safety_buffer_minutes,
      planned_minutes: 0,
      sessions_count: 0
    };

    // Include existing locked sessions in daily planned tracking
    for (const locked of lockedOnDay) {
      scheduledSessions.push({
        id: locked.id,
        subject_id: locked.subject_id,
        subject_name: locked.subject_name || 'Enrolled Subject',
        subject_color: locked.subject_color || '#4f46e5',
        topic_id: locked.topic_id,
        topic_name: locked.topic_name || locked.custom_title,
        custom_title: locked.custom_title,
        date: currentDate,
        start_time: typeof locked.start_time === 'string' && locked.start_time.includes('T')
          ? new Date(locked.start_time).toISOString().substring(11, 16)
          : locked.start_time,
        end_time: typeof locked.end_time === 'string' && locked.end_time.includes('T')
          ? new Date(locked.end_time).toISOString().substring(11, 16)
          : locked.end_time,
        duration_minutes: Number(locked.planned_minutes) || 45,
        priority: 'HIGH',
        priority_score: 99,
        status: locked.status || 'PENDING',
        is_locked: true,
        task_source: locked.task_source || 'MANUAL',
        reason: 'Locked by student'
      });
    }

    if (availableSlots.length === 0 || dayBudgetRemaining < context.preferences.min_session_minutes) {
      continue;
    }

    // Allocate tasks into slots on this date
    let lastScheduledSubjectId = null;
    let consecutiveSubjectCount = 0;

    for (const slot of availableSlots) {
      let slotCurrentMinutes = slot.start_minutes;
      const slotEndMinutes = slot.end_minutes;

      while (slotCurrentMinutes + context.preferences.min_session_minutes <= slotEndMinutes && dayBudgetRemaining >= context.preferences.min_session_minutes) {
        if (remainingTasks.length === 0) break;

        const maxFitMinutes = Math.min(
          slotEndMinutes - slotCurrentMinutes,
          dayBudgetRemaining,
          context.preferences.max_session_minutes
        );

        if (maxFitMinutes < context.preferences.min_session_minutes) {
          break;
        }

        // Apply Subject Diversity: Pick task with highest priority that doesn't violate consecutive subject cap
        let selectedIndex = -1;

        for (let i = 0; i < remainingTasks.length; i++) {
          const t = remainingTasks[i];
          const isSameSubject = t.subject_id === lastScheduledSubjectId;

          if (isSameSubject && consecutiveSubjectCount >= schedulerConfig.DIVERSITY_RULES.MAX_CONSECUTIVE_SAME_SUBJECT) {
            // Check if student has urgent exam for this subject; if not, defer for diversity
            if (t.days_until_exam === null || t.days_until_exam > schedulerConfig.DEADLINE_URGENCY.CRITICAL_DAYS) {
              continue; // Skip to allow subject diversity
            }
          }

          selectedIndex = i;
          break;
        }

        // If all candidates violated diversity, fall back to the first candidate
        if (selectedIndex === -1) {
          selectedIndex = 0;
        }

        const taskToSchedule = remainingTasks.splice(selectedIndex, 1)[0];

        // Sizing: duration must not exceed maxFitMinutes
        const sessionDuration = Math.min(taskToSchedule.estimated_minutes, maxFitMinutes);
        const sessionStartMins = slotCurrentMinutes;
        const sessionEndMins = sessionStartMins + sessionDuration;

        scheduledSessions.push({
          task_id: taskToSchedule.id,
          source_type: taskToSchedule.source,
          subject_id: taskToSchedule.subject_id,
          subject_name: taskToSchedule.subject_name,
          subject_color: taskToSchedule.subject_color,
          topic_id: taskToSchedule.topic_id,
          topic_name: taskToSchedule.topic_name,
          custom_title: taskToSchedule.custom_title,
          date: currentDate,
          start_time: minutesToTimeString(sessionStartMins),
          end_time: minutesToTimeString(sessionEndMins),
          duration_minutes: sessionDuration,
          priority: taskToSchedule.priority,
          priority_score: taskToSchedule.priority_score,
          status: 'PENDING',
          is_locked: false,
          task_source: taskToSchedule.source,
          reason: taskToSchedule.reason
        });

        // Update daily trackers
        dailyBreakdown[currentDate].planned_minutes += sessionDuration;
        dailyBreakdown[currentDate].sessions_count += 1;
        dayBudgetRemaining -= sessionDuration;

        // Subject load tracking
        subjectDistribution[taskToSchedule.subject_name] = (subjectDistribution[taskToSchedule.subject_name] || 0) + sessionDuration;

        // Diversity tracking
        if (taskToSchedule.subject_id === lastScheduledSubjectId) {
          consecutiveSubjectCount++;
        } else {
          lastScheduledSubjectId = taskToSchedule.subject_id;
          consecutiveSubjectCount = 1;
        }

        // Advance slot pointer + break interval
        slotCurrentMinutes = sessionEndMins + context.preferences.break_minutes;
      }
    }
  }

  // 5. Categorize remaining tasks as unscheduled
  for (const remaining of remainingTasks) {
    unscheduledTasks.push({
      ...remaining,
      unscheduled_reason: 'INSUFFICIENT_CAPACITY',
      reason_explanation: 'Available study hours were filled by higher priority exam tasks and recommendations.'
    });
  }

  // 6. Overload Detection
  const totalPlannedMinutes = scheduledSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalAvailableMinutes = Object.values(dailyBreakdown).reduce((sum, d) => sum + d.available_minutes, 0);
  const totalUnscheduledMinutes = unscheduledTasks.reduce((sum, t) => sum + t.estimated_minutes, 0);

  const isOverloaded = unscheduledTasks.length > 0;
  const overloadDetails = isOverloaded
    ? {
        is_overloaded: true,
        required_minutes: totalPlannedMinutes + totalUnscheduledMinutes,
        available_minutes: totalAvailableMinutes,
        shortfall_minutes: totalUnscheduledMinutes,
        unscheduled_count: unscheduledTasks.length
      }
    : null;

  return {
    sessions: scheduledSessions,
    unscheduled_tasks: unscheduledTasks,
    total_planned_minutes: totalPlannedMinutes,
    total_available_minutes: totalAvailableMinutes,
    overloaded: isOverloaded,
    overload_details: overloadDetails,
    daily_breakdown: dailyBreakdown,
    subject_distribution: subjectDistribution,
    algorithm_version: schedulerConfig.ALGORITHM_VERSION
  };
}

export default {
  normalizeCandidates,
  splitTask,
  isPrerequisiteComplete,
  generateSchedule
};
