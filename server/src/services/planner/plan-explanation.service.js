/**
 * plan-explanation.service.js
 *
 * Generates transparent, verifiable educational explanations for study schedules.
 *
 * Two-Tier Architecture:
 * 1. Deterministic Explanation Engine (Authoritative Source):
 *    Directly extracts factual metrics (exam countdown, remaining workload, availability matching,
 *    and priority score) to explain why each session is scheduled at its specific time.
 * 2. Optional Gemini AI Layer:
 *    Enhances the explanation phrasing into encouraging coach feedback.
 *    Strict constraints: Zero invented metrics, zero hallucinated dates, strict fallback on error/timeout.
 */

import { geminiService } from '../gemini.service.js';

/**
 * Builds deterministic factual bullet points for why a specific session is scheduled.
 *
 * @param {Object} session - Scheduled study session
 * @param {Object} [context] - SchedulingContext
 * @returns {{ summary: string, reason_bullets: Array<string> }}
 */
export function generateSessionExplanation(session, context = {}) {
  const bullets = [];

  // Check if locked
  if (session.is_locked) {
    bullets.push('Session is locked by you and preserved at your preferred time.');
    return {
      summary: 'Manually locked study session.',
      reason_bullets: bullets
    };
  }

  // 1. Exam deadline factor
  if (session.days_until_exam !== null && session.days_until_exam !== undefined) {
    if (session.days_until_exam === 0) {
      bullets.push('Exam is scheduled for today.');
    } else if (session.days_until_exam === 1) {
      bullets.push('Exam is tomorrow.');
    } else {
      bullets.push(`Exam is in ${session.days_until_exam} days.`);
    }
  }

  // 2. Workload / Duration factor
  bullets.push(`Allocated ${session.duration_minutes} minutes matching your preferred session length.`);

  // 3. Time slot factor
  bullets.push(`Scheduled at ${session.start_time} - ${session.end_time} within your configured study window.`);

  // 4. Source factor
  if (session.task_source === 'RECOMMENDATION') {
    bullets.push('Prioritized from active smart study recommendations.');
  } else if (session.task_source === 'BACKLOG') {
    bullets.push('Rescheduled to recover missed previous study work.');
  } else if (session.task_source === 'EXAM') {
    bullets.push('High priority review triggered by upcoming exam deadline.');
  }

  return {
    summary: session.reason || `Scheduled ${session.subject_name} for ${session.duration_minutes}m.`,
    reason_bullets: bullets
  };
}

/**
 * Generates deterministic plan-level explanation and optionally enhances with Gemini AI.
 *
 * @param {Object} scheduleResult - Output from generateSchedule
 * @param {Object} context - SchedulingContext
 * @param {Object} [options]
 * @param {boolean} [options.useAI=true] - Whether to attempt Gemini enhancement
 * @returns {Promise<Object>} Schedule explanation payload
 */
export async function generatePlanExplanation(scheduleResult, context, options = {}) {
  const { useAI = true } = options;
  const sessions = scheduleResult.sessions || [];
  const subjectDistribution = scheduleResult.subject_distribution || {};

  // Build deterministic summary
  const subjectEntries = Object.entries(subjectDistribution);
  let topSubjectText = '';
  if (subjectEntries.length > 0) {
    subjectEntries.sort((a, b) => b[1] - a[1]);
    topSubjectText = `Top focus: ${subjectEntries[0][0]} (${subjectEntries[0][1]} min).`;
  }

  const deterministicBullets = [
    `Scheduled ${sessions.length} study session(s) totaling ${scheduleResult.total_planned_minutes} minutes.`,
    topSubjectText || 'Balanced workload distributed across your enrolled subjects.',
    scheduleResult.overloaded
      ? `Notice: ${scheduleResult.unscheduled_tasks.length} task(s) could not fit before deadline due to capacity bounds.`
      : 'All prioritized study goals comfortably fit within your available study windows.'
  ].filter(Boolean);

  const deterministicResult = {
    title: 'Optimized Study Schedule',
    summary: `Your plan schedules ${scheduleResult.total_planned_minutes} minutes across ${sessions.length} focused study sessions.`,
    bullets: deterministicBullets,
    tips: [
      'Take scheduled 10-minute breaks between sessions to maintain focus.',
      'Mark sessions as completed as you finish to keep your analytics up to date.'
    ],
    source: 'DETERMINISTIC'
  };

  if (!useAI || !geminiService.isConfigured()) {
    return deterministicResult;
  }

  // Attempt Gemini AI Enhancement
  const prompt = `You are an empathetic, highly precise academic coach summarizing a newly generated university study schedule.

FACTUAL SCHEDULE DATA (STRICT TRUTH):
- Total Planned Time: ${scheduleResult.total_planned_minutes} minutes
- Total Sessions: ${sessions.length}
- Subject Distribution: ${JSON.stringify(subjectDistribution)}
- Overloaded: ${scheduleResult.overloaded ? 'Yes' : 'No'}
- Key Facts: ${JSON.stringify(deterministicBullets)}

RULES:
1. Provide a motivating, encouraging 2-sentence summary of the schedule.
2. Provide 2 concise, practical study tips tailored to this schedule.
3. DO NOT invent or alter any numbers, minutes, exam dates, or subjects.
4. Return pure JSON with exact keys: "summary", "tips".

JSON Schema:
{
  "summary": "string (1-2 encouraging sentences)",
  "tips": ["string", "string"]
}`;

  try {
    const aiResponse = await geminiService.generateContent({
      prompt,
      systemInstruction: 'You are an educational study coach summarizing student schedules. Use only provided facts.',
      expectJson: true,
      maxOutputTokens: 250
    });

    if (
      aiResponse &&
      typeof aiResponse.summary === 'string' &&
      aiResponse.summary.trim().length > 0 &&
      Array.isArray(aiResponse.tips) &&
      aiResponse.tips.length > 0
    ) {
      return {
        title: 'Optimized Study Schedule',
        summary: aiResponse.summary.trim(),
        bullets: deterministicBullets,
        tips: aiResponse.tips.slice(0, 3),
        source: 'AI_ENHANCED'
      };
    }
  } catch (err) {
    console.warn('Gemini schedule explanation fallback:', err.message);
  }

  return {
    ...deterministicResult,
    source: 'DETERMINISTIC_FALLBACK'
  };
}

export default {
  generateSessionExplanation,
  generatePlanExplanation
};
