import { z } from 'zod';
import { AI_CONFIG } from '../config/ai.config.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates request payload for POST /api/quizzes/generate
 */
export const generateQuizSchema = z.object({
  subject_id: z.string().regex(uuidRegex, 'Invalid subject_id; must be a valid UUID'),
  topic_id: z.string().regex(uuidRegex, 'Invalid topic_id; must be a valid UUID'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: "Difficulty must be 'EASY', 'MEDIUM', or 'HARD'" })
  }).default('MEDIUM'),
  question_count: z.number().int().min(AI_CONFIG.constraints.minQuizQuestions, {
    message: `question_count must be at least ${AI_CONFIG.constraints.minQuizQuestions}`
  }).max(AI_CONFIG.constraints.maxQuizQuestions, {
    message: `question_count cannot exceed ${AI_CONFIG.constraints.maxQuizQuestions}`
  }).default(AI_CONFIG.constraints.defaultQuizQuestions)
});

/**
 * Validates the raw JSON response produced by Gemini AI model.
 * Strict schema guarantees 4 distinct options, unambiguous correct answer matching,
 * and valid pedagogical explanations.
 */
export const aiGeneratedQuizSchema = z.object({
  title: z.string().min(3, 'Quiz title must have at least 3 characters'),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      question_text: z.string().min(8, 'Question text must be at least 8 characters'),
      options: z.array(z.string().min(1, 'Option cannot be empty'))
        .length(4, 'Every MCQ question must have exactly 4 options')
        .refine((opts) => new Set(opts.map(o => o.trim().toLowerCase())).size === 4, {
          message: 'All 4 options must be distinct choices'
        }),
      correct_answer: z.string().min(1, 'Correct answer must be provided'),
      explanation: z.string().min(5, 'Pedagogical explanation must be provided'),
      points: z.number().int().min(1).default(1)
    }).refine((q) => {
      // Validate that correct_answer corresponds to one of the 4 options
      const trimmedTarget = q.correct_answer.trim().toLowerCase();
      return q.options.some(opt => opt.trim().toLowerCase() === trimmedTarget);
    }, {
      message: 'correct_answer must exactly match one of the 4 provided options'
    })
  ).min(1, 'Generated quiz must contain at least one question')
});

/**
 * Validates request payload for POST /api/quizzes/:id/attempts/:attemptId/submit
 */
export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string().regex(uuidRegex, 'Invalid question_id; must be a valid UUID'),
      selected_answer: z.string().nullable().optional()
    })
  ).min(1, 'Must submit at least one answer in the answers array')
});

/**
 * Validates request payload for POST /api/quizzes/:id/questions/:questionId/explain
 */
export const explainQuestionSchema = z.object({
  selected_answer: z.string().nullable().optional()
});

/**
 * Validates standard UUID URL params
 */
export const uuidParamSchema = z.string().regex(uuidRegex, 'Invalid UUID parameter');
