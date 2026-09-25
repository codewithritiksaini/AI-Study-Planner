import api from './api.js';

export const quizService = {
  /**
   * Generates a new conceptual AI quiz and stores it in the database.
   */
  async generateQuiz({ subjectId, topicId, difficulty = 'MEDIUM', questionCount = 5 }) {
    const response = await api.post('/quizzes/generate', {
      subject_id: subjectId,
      topic_id: topicId,
      difficulty,
      question_count: questionCount
    });
    return response?.data || response || null;
  },

  /**
   * Retrieves all quizzes created by the student with optional filters.
   */
  async getQuizzes(filters = {}) {
    const response = await api.get('/quizzes', { params: filters });
    return response?.data?.quizzes || response?.data || response || [];
  },

  /**
   * Retrieves a single quiz by ID (without answer keys for active taking).
   */
  async getQuizById(quizId) {
    const response = await api.get(`/quizzes/${quizId}`);
    return response?.data?.quiz || response?.data || response || null;
  },

  /**
   * Starts a new quiz attempt session.
   */
  async startAttempt(quizId) {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response?.data?.attempt || response?.data || response || null;
  },

  /**
   * Submits answers for a quiz attempt, scoring deterministically on the backend.
   */
  async submitAttempt(quizId, attemptId, answers) {
    const response = await api.post(`/quizzes/${quizId}/attempts/${attemptId}/submit`, {
      answers
    });
    return response?.data || response || null;
  },

  /**
   * Retrieves past quiz attempt history.
   */
  async getQuizHistory(limit = 20) {
    const response = await api.get('/quizzes/history', { params: { limit } });
    return response?.data?.history || response?.data || response || [];
  },

  /**
   * Retrieves full attempt review with correct answers and explanations.
   */
  async getAttemptReview(attemptId) {
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response?.data || response || null;
  },

  /**
   * Generates on-demand AI pedagogical explanation for a question.
   */
  async explainQuestion(quizId, questionId, selectedAnswer = null) {
    const response = await api.post(`/quizzes/${quizId}/questions/${questionId}/explain`, {
      selected_answer: selectedAnswer
    });
    return response?.data || response || null;
  }
};

export default quizService;
