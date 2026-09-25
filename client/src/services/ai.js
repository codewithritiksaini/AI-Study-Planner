import api from './api.js';

export const aiService = {
  /**
   * Retrieves personalized daily study recommendations from Gemini.
   */
  async getRecommendation(date = null) {
    const payload = {};
    if (date) payload.date = date;
    const response = await api.post('/ai/recommendation', payload);
    return response.data?.data || null;
  },

  /**
   * Retrieves natural-language explanation of why today's plan was prioritized.
   */
  async explainPlan(planDate = null) {
    const payload = {};
    if (planDate) payload.plan_date = planDate;
    const response = await api.post('/ai/explain-plan', payload);
    return response.data?.data || null;
  },

  /**
   * Generates a tactical 45-60 min step-by-step study roadmap for a specific topic.
   */
  async getStudyStrategy(topicId) {
    const response = await api.post('/ai/study-strategy', { topic_id: topicId });
    return response.data?.data || null;
  },

  /**
   * Answers a direct student query grounded in their timetable.
   */
  async askAI(message) {
    const response = await api.post('/ai/ask', { message });
    return response.data?.data || null;
  }
};

export default aiService;
