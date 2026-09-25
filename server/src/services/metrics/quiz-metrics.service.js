/**
 * quiz-metrics.service.js
 *
 * Deterministic calculation engine for quiz attempt statistics, score trajectories,
 * recent vs. historical performance comparisons, and trend classifications.
 */

import { getLocalDateString } from './study-metrics.service.js';

/**
 * Calculates quiz performance analytics and trends across student attempts.
 *
 * @param {Array<Object>} attempts - Array of completed quiz_attempts rows
 * @param {string} timezone - Student timezone string
 * @returns {Object} Structured quiz metrics
 */
export function calculateQuizMetrics(attempts = [], timezone = 'UTC') {
  if (!attempts || attempts.length === 0) {
    return {
      available: false,
      total_quizzes: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      recent_average_score: 0,
      previous_average_score: 0,
      difference: 0,
      trend: 'INSUFFICIENT_DATA',
      daily: []
    };
  }

  // Sort chronologically ascending (oldest to newest)
  const sorted = [...attempts].sort((a, b) => {
    const timeA = new Date(a.submitted_at || a.created_at).getTime();
    const timeB = new Date(b.submitted_at || b.created_at).getTime();
    return timeA - timeB;
  });

  const scores = sorted.map(a => Number(a.percentage) || 0);
  const totalQuizzes = scores.length;
  const sumScores = scores.reduce((sum, s) => sum + s, 0);

  const averageScore = Math.round(sumScores / totalQuizzes);
  const highestScore = Math.round(Math.max(...scores));
  const lowestScore = Math.round(Math.min(...scores));

  // Determine recent vs historical averages
  // Recent = up to last 3 attempts
  let recentAverage = 0;
  let previousAverage = 0;
  let trend = 'INSUFFICIENT_DATA';

  if (totalQuizzes === 1) {
    recentAverage = scores[0];
    previousAverage = scores[0];
    trend = 'INSUFFICIENT_DATA';
  } else if (totalQuizzes <= 3) {
    // 2 or 3 attempts: compare latest attempt against earlier attempt(s)
    const latestScore = scores[scores.length - 1];
    const earlierScores = scores.slice(0, scores.length - 1);
    recentAverage = Number(latestScore.toFixed(1));
    previousAverage = Number((earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length).toFixed(1));
  } else {
    // >= 4 attempts: compare last 3 against all prior
    const recentWindow = scores.slice(-3);
    const priorWindow = scores.slice(0, -3);
    recentAverage = Number((recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length).toFixed(1));
    previousAverage = Number((priorWindow.reduce((a, b) => a + b, 0) / priorWindow.length).toFixed(1));
  }

  const difference = Number((recentAverage - previousAverage).toFixed(1));

  if (totalQuizzes >= 2) {
    if (difference >= 5) {
      trend = 'IMPROVING';
    } else if (difference <= -5) {
      trend = 'DECLINING';
    } else {
      trend = 'STABLE';
    }
  }

  // Chronological score points for line charts
  const daily = sorted.map(a => {
    const dStr = getLocalDateString(a.submitted_at || a.created_at, timezone);
    return {
      id: a.id,
      date: dStr,
      score: Math.round(Number(a.percentage) || 0),
      raw_score: a.score,
      max_score: a.max_score,
      quiz_id: a.quiz_id,
      quiz_title: a.quizzes?.title || a.quiz_title || 'Quiz Assessment',
      topic_id: a.quizzes?.topic_id || a.topic_id,
      topic_name: a.quizzes?.topics?.name || a.topic_name || 'Topic'
    };
  });

  return {
    available: true,
    total_quizzes: totalQuizzes,
    average_score: averageScore,
    highest_score: highestScore,
    lowest_score: lowestScore,
    recent_average_score: Math.round(recentAverage),
    previous_average_score: Math.round(previousAverage),
    difference,
    trend,
    daily
  };
}
