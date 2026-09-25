import { quizService } from '../services/quiz.service.js';
import { 
  generateQuizSchema, 
  submitQuizSchema, 
  uuidParamSchema 
} from '../validators/quiz.validator.js';

export const generateQuiz = async (req, res, next) => {
  try {
    const validation = generateQuizSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid quiz generation parameters'
        }
      });
    }

    const quiz = await quizService.generateQuiz(req.user.id, validation.data);
    return res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizzes = async (req, res, next) => {
  try {
    const { subject_id, topic_id, difficulty } = req.query;
    const quizzes = await quizService.getQuizzes(req.user.id, {
      subject_id,
      topic_id,
      difficulty
    });

    return res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizById = async (req, res, next) => {
  try {
    const idValidation = uuidParamSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid quiz ID format'
        }
      });
    }

    // Default to false: Never leak answers before or during quiz taking
    const quiz = await quizService.getQuizById(req.user.id, req.params.id, false);
    return res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

export const startAttempt = async (req, res, next) => {
  try {
    const idValidation = uuidParamSchema.safeParse(req.params.id);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid quiz ID format'
        }
      });
    }

    const attempt = await quizService.startAttempt(req.user.id, req.params.id);
    return res.status(201).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    next(error);
  }
};

export const submitAttempt = async (req, res, next) => {
  try {
    const quizIdValidation = uuidParamSchema.safeParse(req.params.id);
    const attemptIdValidation = uuidParamSchema.safeParse(req.params.attemptId);

    if (!quizIdValidation.success || !attemptIdValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid quiz ID or attempt ID format'
        }
      });
    }

    const validation = submitQuizSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid quiz submission format'
        }
      });
    }

    const result = await quizService.submitAttempt(
      req.user.id,
      req.params.id,
      req.params.attemptId,
      validation.data.answers
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const history = await quizService.getQuizHistory(req.user.id, limit);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getAttemptById = async (req, res, next) => {
  try {
    const idValidation = uuidParamSchema.safeParse(req.params.attemptId);
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid attempt ID format'
        }
      });
    }

    const attempt = await quizService.getAttemptReview(req.user.id, req.params.attemptId);
    return res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    next(error);
  }
};

export const explainQuestion = async (req, res, next) => {
  try {
    const quizIdValidation = uuidParamSchema.safeParse(req.params.id);
    const questionIdValidation = uuidParamSchema.safeParse(req.params.questionId);

    if (!quizIdValidation.success || !questionIdValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid quiz ID or question ID format'
        }
      });
    }

    const explanation = await quizService.explainQuestion(
      req.user.id,
      req.params.id,
      req.params.questionId,
      req.body.selected_answer
    );

    return res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (error) {
    next(error);
  }
};
