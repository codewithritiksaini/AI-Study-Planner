/**
 * completion-metrics.service.js
 *
 * Deterministic calculation engine for syllabus completion, topic status counts,
 * weighted progress velocity, and subject-level academic breakdowns.
 */

import { getLocalDateString } from './study-metrics.service.js';

/**
 * Calculates academic syllabus completion and subject-level metrics.
 *
 * @param {Array<Object>} topics - Array of topics records with subject_id, estimated_minutes, completion_percentage, status
 * @param {Array<Object>} subjects - Array of subjects records with id, name, color, exam_date, target_score
 * @param {string} timezone - Student timezone string
 * @param {string} [referenceDate] - Optional override for current date
 * @returns {Object} Structured academic completion metrics
 */
export function calculateCompletionMetrics(topics = [], subjects = [], timezone = 'UTC', referenceDate = null) {
  const todayStr = referenceDate || getLocalDateString(new Date(), timezone);
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

  let completedTopics = 0;
  let inProgressTopics = 0;
  let notStartedTopics = 0;

  let totalWeightedProgress = 0;
  let totalWeight = 0;

  // Group topics by subject
  const subjectTopicsMap = new Map();
  for (const s of subjects) {
    subjectTopicsMap.set(s.id, []);
  }

  for (const t of topics) {
    const pct = Math.max(0, Math.min(100, Number(t.completion_percentage) || 0));
    const status = (t.status || '').toUpperCase();
    const weight = Math.max(15, Number(t.estimated_minutes) || 60);

    totalWeight += weight;
    totalWeightedProgress += weight * pct;

    if (pct >= 100 || status === 'COMPLETED') {
      completedTopics += 1;
    } else if (pct > 0 || status === 'IN_PROGRESS') {
      inProgressTopics += 1;
    } else {
      notStartedTopics += 1;
    }

    if (subjectTopicsMap.has(t.subject_id)) {
      subjectTopicsMap.get(t.subject_id).push(t);
    }
  }

  const overallCompletionPercentage = totalWeight > 0
    ? Math.min(100, Math.round(totalWeightedProgress / totalWeight))
    : 0;

  // Per-subject analytics summary
  const subjectSummaries = subjects.map(s => {
    const subTopics = subjectTopicsMap.get(s.id) || [];
    let subWeight = 0;
    let subWeightedProg = 0;
    let subCompleted = 0;
    let remainingMinutes = 0;

    for (const t of subTopics) {
      const pct = Math.max(0, Math.min(100, Number(t.completion_percentage) || 0));
      const weight = Math.max(15, Number(t.estimated_minutes) || 60);
      subWeight += weight;
      subWeightedProg += weight * pct;

      if (pct >= 100 || t.status === 'COMPLETED') {
        subCompleted += 1;
      } else {
        remainingMinutes += Math.round(weight * ((100 - pct) / 100));
      }
    }

    const subCompletionPercentage = subWeight > 0
      ? Math.min(100, Math.round(subWeightedProg / subWeight))
      : 0;

    let daysUntilExam = null;
    let isExamUpcoming = false;
    let isExamPassed = false;

    if (s.exam_date) {
      const examDateStr = typeof s.exam_date === 'string' ? s.exam_date.split('T')[0] : getLocalDateString(s.exam_date, timezone);
      const examMs = new Date(examDateStr + 'T00:00:00Z').getTime();
      const diffDays = Math.round((examMs - todayMs) / (24 * 60 * 60 * 1000));
      daysUntilExam = diffDays;
      if (diffDays >= 0) {
        isExamUpcoming = true;
      } else {
        isExamPassed = true;
      }
    }

    return {
      subject_id: s.id,
      subject_name: s.name,
      color: s.color || '#4f46e5',
      target_score: s.target_score || null,
      exam_date: s.exam_date ? (typeof s.exam_date === 'string' ? s.exam_date.split('T')[0] : s.exam_date) : null,
      days_until_exam: daysUntilExam,
      is_exam_upcoming: isExamUpcoming,
      is_exam_passed: isExamPassed,
      total_topics: subTopics.length,
      completed_topics: subCompleted,
      completion_percentage: subCompletionPercentage,
      remaining_estimated_minutes: remainingMinutes
    };
  });

  return {
    subjects_count: subjects.length,
    topics_count: topics.length,
    completed_topics: completedTopics,
    in_progress_topics: inProgressTopics,
    not_started_topics: notStartedTopics,
    overall_completion_percentage: overallCompletionPercentage,
    subjects: subjectSummaries
  };
}
