/**
 * recommendation-explanation.service.js
 *
 * Generates transparent, verifiable educational explanations for study recommendations.
 *
 * Architecture:
 * 1. Deterministic Explanation Engine (Authoritative Source):
 *    Directly transforms structured metrics into factual bullet points and plain-English reasons.
 * 2. Optional Gemini AI Layer (Natural Language Synthesis):
 *    Enhances the explanation phrasing into engaging, encouraging coach feedback.
 *    Strict constraints: Zero invented metrics, zero hallucinated dates, strict fallback on error/timeout.
 */

import { geminiService } from '../gemini.service.js';

/**
 * Builds deterministic, verified explanation bullet points and message
 * directly from candidate structured metrics.
 *
 * @param {Object} candidate - Recommendation candidate object
 * @returns {{ title: string, message: string, reason_bullets: Array<string> }}
 */
export function generateDeterministicExplanation(candidate) {
  const reason = candidate.reason || {};
  const bullets = [];

  switch (candidate.type) {
    case 'WEAK_TOPIC':
      if (reason.quiz_average !== undefined) {
        bullets.push(`Quiz mastery average: ${reason.quiz_average}% (across ${reason.attempt_count || 1} attempt${reason.attempt_count === 1 ? '' : 's'})`);
      }
      if (reason.completion_percentage !== undefined) {
        bullets.push(`Syllabus completion: ${reason.completion_percentage}%`);
      }
      if (reason.days_until_exam !== null && reason.days_until_exam !== undefined) {
        bullets.push(`Subject exam: ${reason.days_until_exam === 0 ? 'Today' : `in ${reason.days_until_exam} day${reason.days_until_exam === 1 ? '' : 's'}`}`);
      }
      break;

    case 'UNFINISHED_TOPIC':
      bullets.push(`Topic completion: ${reason.completion_percentage || 0}% (${reason.remaining_work_percentage || 0}% remaining)`);
      if (reason.estimated_minutes_remaining) {
        bullets.push(`Estimated remaining syllabus work: ~${reason.estimated_minutes_remaining} minutes`);
      }
      if (reason.days_until_exam !== null && reason.days_until_exam !== undefined) {
        bullets.push(`Subject exam: in ${reason.days_until_exam} day${reason.days_until_exam === 1 ? '' : 's'}`);
      }
      break;

    case 'EXAM_PREPARATION':
      bullets.push(`Exam deadline: ${reason.days_until_exam === 0 ? 'Today' : `in ${reason.days_until_exam} day${reason.days_until_exam === 1 ? '' : 's'}`}`);
      if (reason.incomplete_topics_count !== undefined) {
        bullets.push(`Incomplete topics remaining: ${reason.incomplete_topics_count}`);
      }
      if (reason.weak_topics_count !== undefined && reason.weak_topics_count > 0) {
        bullets.push(`Topics requiring mastery improvement: ${reason.weak_topics_count}`);
      }
      break;

    case 'REVISION':
      bullets.push('Topic status: 100% completed');
      if (reason.days_since_last_study) {
        bullets.push(`Last reviewed: ${reason.days_since_last_study} days ago`);
      }
      bullets.push('Spaced repetition recommended to prevent memory decay');
      break;

    case 'QUIZ_PRACTICE':
      if (reason.study_minutes_recorded) {
        bullets.push(`Study time recorded: ${reason.study_minutes_recorded} minutes`);
      }
      bullets.push('Recorded quiz practice: 0 attempts');
      bullets.push('Self-assessment recommended to verify conceptual retention');
      break;

    case 'BACKLOG':
      bullets.push(`Overdue/pending planned tasks: ${reason.backlog_count || 0}`);
      if (reason.missed_count) {
        bullets.push(`Missed tasks: ${reason.missed_count}`);
      }
      if (reason.plan_adherence_percentage !== undefined) {
        bullets.push(`Recent schedule adherence: ${reason.plan_adherence_percentage}%`);
      }
      break;

    case 'STUDY_BALANCE':
      if (reason.dominant_subject_name && reason.dominant_share_percentage) {
        bullets.push(`Recent focus: ${reason.dominant_subject_name} received ${reason.dominant_share_percentage}% of total study hours`);
      }
      if (reason.neglected_subject_name) {
        bullets.push(`Recommended focus: ${reason.neglected_subject_name} (${reason.neglected_share_percentage || 0}% recent allocation)`);
      }
      if (reason.days_until_exam !== null && reason.days_until_exam !== undefined) {
        bullets.push(`Upcoming deadline: in ${reason.days_until_exam} days`);
      }
      break;

    default:
      bullets.push('Action prioritized based on active academic targets and study activity');
      break;
  }

  return {
    title: candidate.title,
    message: candidate.message,
    reason_bullets: bullets
  };
}

/**
 * Optional Gemini AI layer to enhance the phrasing of the recommendation.
 * If Gemini is not configured, times out, or fails, returns the deterministic explanation.
 *
 * @param {Object} candidate - Prioritized recommendation candidate
 * @returns {Promise<Object>} Recommendation with attached explanation
 */
export async function enhanceExplanationWithAI(candidate) {
  const deterministic = generateDeterministicExplanation(candidate);

  if (!geminiService.isConfigured()) {
    return {
      ...candidate,
      explanation: {
        title: deterministic.title,
        message: deterministic.message,
        reason_bullets: deterministic.reason_bullets,
        source: 'DETERMINISTIC'
      }
    };
  }

  const prompt = `You are an empathetic, highly precise academic coach explaining an educational study recommendation to a university student.

FACTUAL CONTEXT (STRICT TRUTH):
- Recommendation Type: ${candidate.type}
- Subject: ${candidate.subject_name || 'Enrolled Subject'}
- Topic: ${candidate.topic_name || 'Syllabus Work'}
- Priority Level: ${candidate.priority}
- Estimated Duration: ${candidate.estimated_minutes} minutes
- Fact Bullets: ${JSON.stringify(deterministic.reason_bullets)}

RULES:
1. Explain concisely why this study action is important right now in 1-2 motivating sentences.
2. DO NOT invent or alter any metrics, exam dates, or test scores.
3. DO NOT use judgmental, discouraging, or alarming language.
4. Return pure JSON with exact keys: "title", "message", "reason_summary".

JSON Schema:
{
  "title": "string (concise action title)",
  "message": "string (1-2 sentence motivating explanation)",
  "reason_summary": "string (short 1-line factual summary)"
}`;

  try {
    const aiResponse = await geminiService.generateContent({
      prompt,
      systemInstruction: 'You are an educational study planner recommendation explainer. Only use provided facts.',
      expectJson: true,
      maxOutputTokens: 250
    });

    if (
      aiResponse &&
      typeof aiResponse.title === 'string' &&
      typeof aiResponse.message === 'string' &&
      aiResponse.title.trim().length > 0 &&
      aiResponse.message.trim().length > 0
    ) {
      return {
        ...candidate,
        title: aiResponse.title.trim(),
        message: aiResponse.message.trim(),
        explanation: {
          title: aiResponse.title.trim(),
          message: aiResponse.message.trim(),
          reason_summary: aiResponse.reason_summary || deterministic.message,
          reason_bullets: deterministic.reason_bullets,
          source: 'AI_ENHANCED'
        }
      };
    }
  } catch (err) {
    // Graceful fallback to deterministic explanation
    console.warn('Gemini recommendation explanation fallback:', err.message);
  }

  return {
    ...candidate,
    explanation: {
      title: deterministic.title,
      message: deterministic.message,
      reason_bullets: deterministic.reason_bullets,
      source: 'DETERMINISTIC_FALLBACK'
    }
  };
}

export default {
  generateDeterministicExplanation,
  enhanceExplanationWithAI
};
