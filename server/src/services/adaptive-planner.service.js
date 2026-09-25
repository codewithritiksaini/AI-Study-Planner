import { query, getDbPool } from '../config/db.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';
import {
  calculateAdaptivePriority,
  generateAdaptiveReason
} from './priority.service.js';
import {
  calculateAvailableMinutes,
  validateSchedule
} from './scheduling.service.js';
import { getLocalDateString } from './metrics/index.js';

export class AdaptivePlannerService {
  /**
   * 1. Builds complete planning context from all student data sources:
   * - profiles (availability, window, timezone)
   * - subjects (exam dates, goals)
   * - topics (difficulty, completion percentage, estimated minutes)
   * - topic_performance (Phase 7 accuracy, tiers, recent vs avg trends)
   * - study_sessions (Phase 4 recency & observed study capacity)
   * - study_plans (Phase 5 historical plans, preserved completed tasks, missed pressure)
   */
  async buildPlanningContext(userId, { startDate, days = 7 }) {
    const pool = getDbPool();

    // 1. Fetch Profile
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

    // 2. Fetch Subjects
    const subjRes = await query(
      `SELECT id, name, exam_date, target_score, color
       FROM public.subjects
       WHERE user_id = $1;`,
      [userId]
    );
    const subjects = subjRes.rows;
    const subjectsMap = new Map();
    subjects.forEach(s => subjectsMap.set(s.id, s));

    // 3. Fetch Incomplete Candidate Topics
    const subjectIds = subjects.map(s => s.id);
    let topics = [];
    if (subjectIds.length > 0) {
      const topicsRes = await query(
        `SELECT id, subject_id, name, description, difficulty, estimated_minutes, status, completion_percentage
         FROM public.topics
         WHERE subject_id = ANY($1::uuid[])
           AND status != 'COMPLETED'
           AND (completion_percentage IS NULL OR completion_percentage < 100)
         ORDER BY created_at ASC;`,
        [subjectIds]
      );
      topics = topicsRes.rows;
    }

    // 4. Fetch Phase 7 Topic Performance Records
    const topicIds = topics.map(t => t.id);
    const performanceMap = new Map();
    if (topicIds.length > 0) {
      const perfRes = await query(
        `SELECT topic_id, performance_level, average_percentage, recent_percentage, confidence_score, attempt_count, last_attempted_at
         FROM public.topic_performance
         WHERE user_id = $1 AND topic_id = ANY($2::uuid[]);`,
        [userId, topicIds]
      );
      perfRes.rows.forEach(p => performanceMap.set(p.topic_id, p));
    }

    // 5. Fetch Phase 4 Recent Study Sessions (14-day lookback window)
    const lookbackDays = PLANNER_CONFIG.adaptiveScheduling.recentActivityDays || 14;
    const sessRes = await query(
      `SELECT id, topic_id, subject_id, duration_minutes, started_at
       FROM public.study_sessions
       WHERE user_id = $1 
         AND status = 'COMPLETED'
         AND started_at >= now() - ($2 || ' days')::interval
       ORDER BY started_at DESC;`,
      [userId, lookbackDays]
    );
    const recentSessions = sessRes.rows;

    const lastStudiedMap = new Map();
    recentSessions.forEach(s => {
      if (s.topic_id && !lastStudiedMap.has(s.topic_id)) {
        lastStudiedMap.set(s.topic_id, s.started_at);
      }
    });

    // 6. Fetch Existing Plans in the Planning Window & Historical Missed Counts
    const endDate = new Date(new Date(startDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const plansRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date >= $2 AND p.plan_date <= $3
       ORDER BY p.plan_date ASC, p.start_time ASC;`,
      [userId, startDate, endDate]
    );
    const existingWindowPlans = plansRes.rows;

    // Fetch missed plan count per topic across recent history
    const missedRes = await query(
      `SELECT topic_id, COUNT(*)::int AS missed_count
       FROM public.study_plans
       WHERE user_id = $1 
         AND status = 'MISSED'
         AND plan_date >= now()::date - INTERVAL '21 days'
       GROUP BY topic_id;`,
      [userId]
    );
    const missedCountMap = new Map();
    missedRes.rows.forEach(m => missedCountMap.set(m.topic_id, m.missed_count));

    return {
      profile,
      subjects,
      subjectsMap,
      topics,
      performanceMap,
      recentSessions,
      lastStudiedMap,
      existingWindowPlans,
      missedCountMap,
      startDate,
      endDate,
      days
    };
  }

  /**
   * 2. Calculates Effective Daily Capacity:
   * Reconciles declared availability with observed recent study habit.
   * If student logged >= 3 sessions in the lookback window, applies observed capacity factor,
   * bounded by declared availability.
   */
  calculateEffectiveCapacity(profile, recentSessions) {
    const declaredMinutes = calculateAvailableMinutes(profile);

    // If fewer than 3 sessions logged, rely strictly on declared capacity
    if (!recentSessions || recentSessions.length < 3) {
      return {
        declared_capacity: declaredMinutes,
        effective_capacity: declaredMinutes,
        is_capacity_adjusted: false,
        observed_average: null
      };
    }

    const timezone = profile?.timezone || 'UTC';

    // Group actual duration by calendar day using timezone-aware local date
    const dayTotals = new Map();
    recentSessions.forEach(s => {
      const day = getLocalDateString(s.started_at, timezone);
      const mins = Number(s.duration_minutes) || 0;
      dayTotals.set(day, (dayTotals.get(day) || 0) + mins);
    });

    const activeDays = dayTotals.size;
    if (activeDays < 2) {
      return {
        declared_capacity: declaredMinutes,
        effective_capacity: declaredMinutes,
        is_capacity_adjusted: false,
        observed_average: null
      };
    }

    let totalMins = 0;
    dayTotals.forEach(mins => { totalMins += mins; });
    const observedDailyAvg = Math.round(totalMins / activeDays);

    // Apply conservative elasticity factor
    const elasticity = PLANNER_CONFIG.adaptiveScheduling.observedCapacityAdjustmentFactor || 1.15;
    const adjustedObserved = Math.round(observedDailyAvg * elasticity);

    // Effective capacity cannot exceed declared capacity, and cannot fall below min study block (20m)
    const minBlock = PLANNER_CONFIG.adaptiveScheduling.minStudyBlockMinutes || 20;
    const effectiveCapacity = Math.max(minBlock, Math.min(declaredMinutes, adjustedObserved));

    const isAdjusted = effectiveCapacity < declaredMinutes;

    return {
      declared_capacity: declaredMinutes,
      effective_capacity: effectiveCapacity,
      is_capacity_adjusted: isAdjusted,
      observed_average: observedDailyAvg
    };
  }

  /**
   * 3. Ranks Candidate Topics dynamically against a specific planning date.
   * Uses Phase 8 6-factor adaptive priority formula with deterministic tie-breaking.
   */
  rankCandidateTopics(topics, subjectsMap, performanceMap, lastStudiedMap, missedCountMap, planningDateStr) {
    const scored = topics.map(topic => {
      const subject = subjectsMap.get(topic.subject_id);
      const performance = performanceMap.get(topic.id) || null;
      const lastStudiedAt = lastStudiedMap.get(topic.id) || null;
      const missedCount = missedCountMap.get(topic.id) || 0;

      const priorityResult = calculateAdaptivePriority({
        examDateStr: subject?.exam_date || null,
        planningDateStr,
        completionPercentage: topic.completion_percentage || 0,
        topicPerformance: performance,
        lastStudiedAt,
        difficulty: topic.difficulty || 'MEDIUM',
        missedCount
      });

      const reason = generateAdaptiveReason({
        signals: priorityResult.signals,
        subjectName: subject?.name || 'Subject',
        topicName: topic.name,
        examDateStr: subject?.exam_date || null,
        planningDateStr,
        topicPerformance: performance,
        missedCount
      });

      return {
        ...topic,
        subject_name: subject?.name || 'Subject',
        subject_color: subject?.color || '#4f46e5',
        exam_date: subject?.exam_date || null,
        priority_score: priorityResult.priority_score,
        priority_score_100: priorityResult.priority_score_100,
        priority_label: priorityResult.priority_label,
        signals: priorityResult.signals,
        driving_factors: priorityResult.driving_factors,
        reason
      };
    });

    // Deterministic Tie-Breaking
    scored.sort((a, b) => {
      // 1. Primary: Priority score descending
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }

      // 2. Tie-break: Earlier exam date
      if (a.exam_date && b.exam_date) {
        const diff = new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
        if (diff !== 0) return diff;
      } else if (a.exam_date && !b.exam_date) {
        return -1;
      } else if (!a.exam_date && b.exam_date) {
        return 1;
      }

      // 3. Tie-break: Weaker performance
      if (b.signals.weakness !== a.signals.weakness) {
        return b.signals.weakness - a.signals.weakness;
      }

      // 4. Tie-break: Lower syllabus completion
      const compA = a.completion_percentage || 0;
      const compB = b.completion_percentage || 0;
      if (compA !== compB) {
        return compA - compB;
      }

      // 5. Tie-break: Creation order / ID
      return String(a.id).localeCompare(String(b.id));
    });

    return scored;
  }

  /**
   * 4. Multi-Day Adaptive Allocation Algorithm
   * Distributes study tasks across days:
   * - Topic splitting (>90m split across days)
   * - Small topic packing (>=20m)
   * - Subject balancing across the week
   * - Zero scheduling for expired subject exams
   * - Preserves completed and in-progress plans
   * - Places tasks in user's preferred study window with 10m breaks after >=50m blocks
   */
  allocateAdaptiveSchedule({
    context,
    capacityInfo,
    planningDates
  }) {
    const {
      profile,
      subjectsMap,
      topics,
      performanceMap,
      lastStudiedMap,
      missedCountMap,
      existingWindowPlans
    } = context;

    const { effective_capacity } = capacityInfo;
    const { adaptiveScheduling } = PLANNER_CONFIG;
    const minBlock = adaptiveScheduling.minStudyBlockMinutes || 20;
    const maxBlock = adaptiveScheduling.maxStudyBlockMinutes || 90;

    // Track remaining workload per topic across multi-day planning
    const remainingTopicWorkload = new Map();
    topics.forEach(t => {
      const estimated = Number(t.estimated_minutes) || PLANNER_CONFIG.scheduling.defaultTopicDurationMinutes;
      const comp = Number(t.completion_percentage) || 0;
      const uncompletedMins = Math.max(minBlock, Math.round(estimated * (1 - comp / 100)));
      remainingTopicWorkload.set(t.id, uncompletedMins);
    });

    // Track subject allocation counts for weekly balance
    const subjectDayAllocations = new Map();

    const allGeneratedPlans = [];

    for (let dayIdx = 0; dayIdx < planningDates.length; dayIdx++) {
      const currentDateStr = planningDates[dayIdx];

      // Identify preserved plans on this date (COMPLETED or IN_PROGRESS)
      const dayExisting = existingWindowPlans.filter(p => p.plan_date === currentDateStr);
      const preservedPlans = dayExisting.filter(
        p => p.status === PLANNER_CONFIG.statuses.COMPLETED || p.status === PLANNER_CONFIG.statuses.IN_PROGRESS
      );

      const committedMinutes = preservedPlans.reduce((sum, p) => sum + (Number(p.planned_minutes) || 0), 0);
      let dayRemainingBudget = Math.max(0, effective_capacity - committedMinutes);

      if (dayRemainingBudget < minBlock) {
        // Capacity already satisfied by preserved plans
        continue;
      }

      // Rank candidate topics dynamically for this date
      const rankedCandidates = this.rankCandidateTopics(
        topics,
        subjectsMap,
        performanceMap,
        lastStudiedMap,
        missedCountMap,
        currentDateStr
      );

      // Filter eligible candidates for this day:
      // 1. Topic must have remaining workload > 0
      // 2. Exam date must not be passed (if planDate > examDate, cannot schedule regular prep)
      const eligibleForDay = rankedCandidates.filter(c => {
        const remainingWork = remainingTopicWorkload.get(c.id) || 0;
        if (remainingWork <= 0) return false;

        if (c.exam_date) {
          const examD = new Date(c.exam_date).setHours(0, 0, 0, 0);
          const planD = new Date(currentDateStr).setHours(0, 0, 0, 0);
          if (planD > examD) return false; // Exam has passed before this study day
        }

        return true;
      });

      if (eligibleForDay.length === 0) {
        continue;
      }

      // Subject Diversity & Balancing Selection:
      // Sort candidates giving slight preference to subjects not yet heavily scheduled today
      const scheduledSubjectsToday = new Set(preservedPlans.map(p => p.subject_id));
      const dayAllocatedTasks = [];

      // Sort with secondary subject-diversity weighting
      const prioritizedSelection = [...eligibleForDay].sort((a, b) => {
        const aSeenToday = scheduledSubjectsToday.has(a.subject_id) ? 1 : 0;
        const bSeenToday = scheduledSubjectsToday.has(b.subject_id) ? 1 : 0;
        if (aSeenToday !== bSeenToday && Math.abs(a.priority_score - b.priority_score) < 0.15) {
          return aSeenToday - bSeenToday; // Prefer subject not seen today if priority is close
        }
        return b.priority_score - a.priority_score;
      });

      for (const candidate of prioritizedSelection) {
        if (dayRemainingBudget < minBlock) break;

        const remainingWork = remainingTopicWorkload.get(candidate.id) || 0;
        if (remainingWork <= 0) continue;

        // Topic Splitting: cap duration at maxBlock (90m) or remaining budget
        let blockMinutes = Math.min(remainingWork, maxBlock);
        blockMinutes = Math.min(blockMinutes, dayRemainingBudget);

        if (blockMinutes >= minBlock) {
          dayAllocatedTasks.push({
            ...candidate,
            planned_minutes: blockMinutes
          });

          dayRemainingBudget -= blockMinutes;
          remainingTopicWorkload.set(candidate.id, remainingWork - blockMinutes);
          scheduledSubjectsToday.add(candidate.subject_id);
        }
      }

      // Generate non-overlapping time slots in student's preferred study window
      if (dayAllocatedTasks.length > 0) {
        const dayTimeSlots = this.createAdaptiveTimeSlots(
          dayAllocatedTasks,
          currentDateStr,
          profile,
          preservedPlans
        );

        // Validate daily schedule constraints
        const validation = validateSchedule(
          [...preservedPlans, ...dayTimeSlots],
          effective_capacity
        );

        if (!validation.valid) {
          console.warn(`Schedule validation warning for ${currentDateStr}:`, validation.error);
        }

        allGeneratedPlans.push(...dayTimeSlots);
      }
    }

    return allGeneratedPlans;
  }

  /**
   * 5. Creates Adaptive Time Slots with break insertion and metadata
   */
  createAdaptiveTimeSlots(allocatedTasks, planningDateStr, profile, existingPlans = []) {
    const { scheduling } = PLANNER_CONFIG;

    const startTimeStr = profile?.preferred_study_start_time || scheduling.defaultStudyStartTime;
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [year, month, day] = planningDateStr.split('-').map(Number);

    let currentCursor = new Date(Date.UTC(year, month - 1, day, startH, startM, 0, 0));

    // If existing preserved plans exist today, offset cursor after their end_time
    if (existingPlans && existingPlans.length > 0) {
      const latestEnd = existingPlans
        .filter(p => p.end_time)
        .map(p => new Date(p.end_time))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (latestEnd && latestEnd.getTime() > currentCursor.getTime()) {
        currentCursor = new Date(latestEnd.getTime() + scheduling.breakDurationMinutes * 60 * 1000);
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
        topic_id: task.id,
        plan_date: planningDateStr,
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        planned_minutes: task.planned_minutes,
        priority_score: task.priority_score,
        reason: task.reason,
        status: PLANNER_CONFIG.statuses.PENDING,
        source: PLANNER_CONFIG.sources.ADAPTIVE_ENGINE,
        adaptation_metadata: {
          signals: task.signals,
          driving_factors: task.driving_factors,
          priority_score_100: task.priority_score_100
        },
        // Metadata for UI responses
        subject_name: task.subject_name,
        subject_color: task.subject_color,
        topic_name: task.name
      });

      // Advance cursor: insert break if task >= breakIntervalMinutes (50m)
      const breakMs = task.planned_minutes >= scheduling.breakIntervalMinutes
        ? scheduling.breakDurationMinutes * 60 * 1000
        : 0;

      currentCursor = new Date(slotEnd.getTime() + breakMs);
    }

    return scheduledPlans;
  }

  /**
   * 6. Generates full adaptive study plan across a 1 to 14 day horizon.
   * Safe Regeneration Policy:
   * - Strictly preserves COMPLETED and IN_PROGRESS plans.
   * - Replaces only future PENDING, SKIPPED, and MISSED plans.
   * - Never creates or alters past date plans.
   */
  async generateAdaptivePlan(userId, { startDate, days = 7, forceRegenerate = false }) {
    // 1. Sanitize planning horizon (1 to 14 days)
    const validDays = Math.max(1, Math.min(14, Number(days) || 7));
    const nowLocal = new Date().toISOString().split('T')[0];
    const initialDate = startDate && startDate >= nowLocal ? startDate : nowLocal;

    // 2. Build full multi-source planning context
    const context = await this.buildPlanningContext(userId, { startDate: initialDate, days: validDays });

    // 3. Compute realistic capacity
    const capacityInfo = this.calculateEffectiveCapacity(context.profile, context.recentSessions);

    // If no subjects or topics exist, return helpful empty plan
    if (context.subjects.length === 0 || context.topics.length === 0) {
      return {
        planning_window: {
          start_date: initialDate,
          end_date: context.endDate,
          days: validDays
        },
        capacity: capacityInfo,
        tasks_created: 0,
        total_planned_minutes: 0,
        tasks: [],
        message: context.subjects.length === 0
          ? 'Add subjects and syllabus topics before generating an adaptive plan.'
          : 'All current topics are completed! No incomplete syllabus topics require scheduling.'
      };
    }

    // Build planning dates array
    const planningDates = [];
    for (let i = 0; i < validDays; i++) {
      const d = new Date(new Date(initialDate).getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      planningDates.push(d);
    }

    // 4. Run multi-day adaptive scheduling allocation
    const generatedTasks = this.allocateAdaptiveSchedule({
      context,
      capacityInfo,
      planningDates
    });

    // 5. Transactional Persistence to public.study_plans
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Safe Regeneration: delete only future PENDING, SKIPPED, MISSED plans in target window
      await client.query(
        `DELETE FROM public.study_plans
         WHERE user_id = $1
           AND plan_date >= $2
           AND plan_date <= $3
           AND status IN ('PENDING', 'SKIPPED', 'MISSED');`,
        [userId, initialDate, context.endDate]
      );

      // Insert new adaptive tasks
      for (const t of generatedTasks) {
        await client.query(
          `INSERT INTO public.study_plans (
              user_id,
              subject_id,
              topic_id,
              plan_date,
              start_time,
              end_time,
              planned_minutes,
              priority_score,
              reason,
              status,
              source,
              adaptation_metadata
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
          [
            userId,
            t.subject_id,
            t.topic_id,
            t.plan_date,
            t.start_time,
            t.end_time,
            t.planned_minutes,
            t.priority_score,
            t.reason,
            t.status,
            t.source,
            JSON.stringify(t.adaptation_metadata || null)
          ]
        );
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('Failed to commit adaptive study plans:', txErr.message);
      throw txErr;
    } finally {
      client.release();
    }

    const totalPlannedMinutes = generatedTasks.reduce((s, t) => s + t.planned_minutes, 0);

    return {
      planning_window: {
        start_date: initialDate,
        end_date: context.endDate,
        days: validDays
      },
      capacity: capacityInfo,
      tasks_created: generatedTasks.length,
      total_planned_minutes: totalPlannedMinutes,
      tasks: generatedTasks
    };
  }

  /**
   * 7. Convenience safe regeneration
   */
  async regenerateAdaptivePlan(userId, { startDate, days = 7 }) {
    return this.generateAdaptivePlan(userId, { startDate, days, forceRegenerate: true });
  }

  /**
   * 8. Today's Adaptive Plan
   */
  async getAdaptiveToday(userId, { date = null, timezone } = {}) {
    const today = date || new Date().toISOString().split('T')[0];

    // Get profile for capacity calculation
    const profileRes = await query(
      `SELECT id, daily_available_hours, preferred_study_start_time, preferred_study_end_time, timezone
       FROM public.profiles
       WHERE id = $1;`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    // Fetch recent study sessions to reconcile observed vs declared capacity
    const lookbackDays = PLANNER_CONFIG.adaptiveScheduling.recentActivityDays || 14;
    const sessRes = await query(
      `SELECT id, topic_id, subject_id, duration_minutes, started_at
       FROM public.study_sessions
       WHERE user_id = $1 
         AND status = 'COMPLETED'
         AND started_at >= now() - ($2 || ' days')::interval
       ORDER BY started_at DESC;`,
      [userId, lookbackDays]
    );
    const capacityInfo = this.calculateEffectiveCapacity(profile, sessRes.rows);

    const plansRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC NULLS LAST;`,
      [userId, today]
    );

    const plans = plansRes.rows;
    const capacityMinutes = capacityInfo.effective_capacity;

    const plannedMinutes = plans.reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);
    const completedMinutes = plans
      .filter(p => p.status === PLANNER_CONFIG.statuses.COMPLETED)
      .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);
    const pendingMinutes = plans
      .filter(p => p.status === PLANNER_CONFIG.statuses.PENDING || p.status === PLANNER_CONFIG.statuses.IN_PROGRESS)
      .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);

    return {
      date: today,
      capacity_minutes: capacityMinutes,
      declared_capacity_minutes: capacityInfo.declared_capacity,
      is_capacity_adjusted: capacityInfo.is_capacity_adjusted,
      observed_average: capacityInfo.observed_average,
      planned_minutes: plannedMinutes,
      completed_minutes: completedMinutes,
      pending_minutes: pendingMinutes,
      remaining_capacity: Math.max(0, capacityMinutes - plannedMinutes),
      tasks: plans,
      plans
    };
  }

  /**
   * 9. 7-Day Weekly Adaptive Timetable View
   */
  async getAdaptiveWeek(userId, { startDate } = {}) {
    const today = new Date().toISOString().split('T')[0];
    const initialDate = startDate && startDate >= today ? startDate : today;

    const endDate = new Date(new Date(initialDate).getTime() + 6 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // Fetch Profile
    const profileRes = await query(
      `SELECT id, daily_available_hours, preferred_study_start_time, preferred_study_end_time, timezone
       FROM public.profiles
       WHERE id = $1;`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    // Fetch recent study sessions to calculate effective capacity
    const lookbackDays = PLANNER_CONFIG.adaptiveScheduling.recentActivityDays || 14;
    const sessRes = await query(
      `SELECT id, topic_id, subject_id, duration_minutes, started_at
       FROM public.study_sessions
       WHERE user_id = $1 
         AND status = 'COMPLETED'
         AND started_at >= now() - ($2 || ' days')::interval
       ORDER BY started_at DESC;`,
      [userId, lookbackDays]
    );
    const capacityInfo = this.calculateEffectiveCapacity(profile, sessRes.rows);
    const dailyCapacityMinutes = capacityInfo.effective_capacity;

    // Fetch all plans in the 7-day range
    const plansRes = await query(
      `SELECT p.*,
              json_build_object('id', s.id, 'name', s.name, 'color', s.color) AS subjects,
              json_build_object('id', t.id, 'name', t.name, 'difficulty', t.difficulty, 'completion_percentage', t.completion_percentage, 'estimated_minutes', t.estimated_minutes) AS topics
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date >= $2 AND p.plan_date <= $3
       ORDER BY p.plan_date ASC, p.start_time ASC NULLS LAST;`,
      [userId, initialDate, endDate]
    );

    const allPlans = plansRes.rows;

    // Group plans by date
    const daysMap = new Map();
    for (let i = 0; i < 7; i++) {
      const dateStr = new Date(new Date(initialDate).getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      daysMap.set(dateStr, []);
    }

    allPlans.forEach(p => {
      const d = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : new Date(p.plan_date).toISOString().split('T')[0];
      if (daysMap.has(d)) {
        daysMap.get(d).push(p);
      }
    });

    const days = [];
    daysMap.forEach((tasks, date) => {
      const planned = tasks.reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);
      const completed = tasks
        .filter(p => p.status === PLANNER_CONFIG.statuses.COMPLETED)
        .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);

      days.push({
        date,
        capacity_minutes: dailyCapacityMinutes,
        declared_capacity_minutes: capacityInfo.declared_capacity,
        is_capacity_adjusted: capacityInfo.is_capacity_adjusted,
        planned_minutes: planned,
        completed_minutes: completed,
        pending_count: tasks.filter(p => p.status === PLANNER_CONFIG.statuses.PENDING).length,
        tasks,
        plans: tasks
      });
    });

    return {
      start_date: initialDate,
      end_date: endDate,
      total_planned_minutes: allPlans.reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0),
      total_completed_minutes: allPlans.filter(p => p.status === PLANNER_CONFIG.statuses.COMPLETED).reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0),
      days
    };
  }

  /**
   * 10. Updates Plan Status (PENDING -> IN_PROGRESS, COMPLETED, SKIPPED, MISSED)
   */
  async updatePlanStatus(userId, planId, status) {
    const upperStatus = String(status).toUpperCase();

    // Verify valid status value
    if (!PLANNER_CONFIG.statuses[upperStatus]) {
      const err = new Error(`Invalid status: ${status}. Must be one of: PENDING, IN_PROGRESS, COMPLETED, MISSED, SKIPPED.`);
      err.statusCode = 400;
      err.code = 'INVALID_PLAN_STATUS';
      throw err;
    }

    // Verify plan exists and belongs to user
    const checkRes = await query(
      `SELECT id, status, plan_date
       FROM public.study_plans
       WHERE id = $1 AND user_id = $2;`,
      [planId, userId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Study plan task not found or access denied.');
      err.statusCode = 404;
      err.code = 'PLAN_NOT_FOUND';
      throw err;
    }

    const currentPlan = checkRes.rows[0];

    // Validate state transition
    const allowedTransitions = PLANNER_CONFIG.validStatusTransitions[currentPlan.status] || [];
    if (!allowedTransitions.includes(upperStatus) && currentPlan.status !== upperStatus) {
      const err = new Error(`Cannot transition study plan status from ${currentPlan.status} to ${upperStatus}.`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    // Update status
    const updateRes = await query(
      `UPDATE public.study_plans
       SET status = $1,
           updated_at = timezone('utc'::text, now())
       WHERE id = $2 AND user_id = $3
       RETURNING *;`,
      [upperStatus, planId, userId]
    );

    return updateRes.rows[0];
  }
}

export const adaptivePlannerService = new AdaptivePlannerService();
export default adaptivePlannerService;
